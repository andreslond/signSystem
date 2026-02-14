import { createSupabaseUserClient } from '../config/supabase'
import { Document, DocumentStatus } from '../types'
import Logger from '../utils/logger'

/**
 * DocumentUserRepository - User-context repository for document read operations.
 * 
 * Responsibilities:
 * - Read data owned by the authenticated user
 * - Use a Supabase client initialized with the user JWT
 * - Rely on RLS for access control
 * - NEVER write to the database
 * 
 * PERFORMANCE OPTIMIZATION:
 * This repository uses composite indexes on (user_id, status, created_at DESC)
 * which allows efficient filtering and sorting without full table scans.
 */
export class DocumentUserRepository {
  constructor(private userToken: string) {}

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  /**
   * Get paginated documents for a user with optional status filtering.
   * 
   * @param userId - The ID of the user
   * @param status - Optional status filter (PENDING, SIGNED, INVALIDATED)
   * @param limit - Maximum number of documents to return (default: 10, max: 50)
   * @param offset - Number of documents to skip (default: 0)
   * @returns Array of documents matching the criteria
   */
  async listDocumentsByUserAndStatus(
    userId: string,
    status: DocumentStatus | null,
    limit: number,
    offset: number
  ): Promise<Document[]> {
    let query = this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply status filter only if provided
    // The composite index (user_id, status, created_at DESC) optimizes this query
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination using range (limit, offset)
    // range(start, end) where end = start + limit - 1
    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      Logger.error('Failed to get documents by user and status', {
        error: error.message,
        code: error.code,
        userId,
        status,
        limit,
        offset
      })
      throw error
    }
    return data || []
  }

  /**
   * Count total documents for a user with optional status filter.
   * This is used to calculate pagination metadata.
   * 
   * @param userId - The ID of the user
   * @param status - Optional status filter
   * @returns Total count of matching documents
   */
  async countDocumentsByUserAndStatus(
    userId: string,
    status: DocumentStatus | null
  ): Promise<number> {
    let query = this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) {
      Logger.error('Failed to count documents', {
        error: error.message,
        code: error.code,
        userId,
        status
      })
      throw error
    }
    return count || 0
  }

  /**
   * Get all documents for a user (legacy method, kept for backward compatibility)
   * @param userId - The ID of the user
   * @returns Array of documents owned by the user
   */
  async listDocumentsByUser(userId: string): Promise<Document[]> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      Logger.error('Failed to get documents by user', { error: error.message, code: error.code, userId })
      throw error
    }
    return data || []
  }

  /**
   * Get a specific document by ID for a user with employee data.
   * This method validates ownership through RLS and fetches employee data separately.
   * @param documentId - The ID of the document
   * @param userId - The ID of the user (used for RLS filtering)
   * @returns The document with employee data if found and owned by user, null if not found
   */
  async getDocumentByIdWithEmployee(documentId: string, userId: string): Promise<Document | null> {
    // First get the document
    const { data: documentData, error: docError } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (docError) {
      if (docError.code === 'PGRST116') return null
      Logger.error('Failed to get document by ID', { 
        error: docError.message, 
        code: docError.code, 
        documentId, 
        userId 
      })
      throw docError
    }
    
    // If document has employee_id, fetch employee data separately
    if (documentData && documentData.employee_id) {
      const { data: employeeData, error: empError } = await this.supabaseClient
        .schema('ar_nomina')
        .from('employees')
        .select('name, email, identification_number, identification_type')
        .eq('id', documentData.employee_id)
        .single()
      
      if (!empError && employeeData) {
        documentData.employee_name = employeeData.name
        documentData.employee_email = employeeData.email
        documentData.employee_identification_number = employeeData.identification_number
        documentData.employee_identification_type = employeeData.identification_type
      }
    }
    
    // If document is signed, fetch signature data to get signer name
    if (documentData && documentData.status === 'SIGNED') {
      const { data: signatureData, error: sigError } = await this.supabaseClient
        .schema('ar_signatures')
        .from('signatures')
        .select('name, identification_number, identification_type')
        .eq('document_id', documentId)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!sigError && signatureData) {
        documentData.signer_name = signatureData.name
        documentData.signer_identification = signatureData.identification_number
        documentData.signer_identification_type = signatureData.identification_type
      }
    }
    
    return documentData
  }

  /**
   * Get a specific document by ID for a user.
   * This method validates ownership through RLS - if the user doesn't own the document,
   * RLS will return null or an error.
   * @param documentId - The ID of the document
   * @param userId - The ID of the user (used for RLS filtering)
   * @returns The document if found and owned by user, null if not found
   */
  async getDocumentById(documentId: string, userId: string): Promise<Document | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      Logger.error('Failed to get document by ID', { error: error.message, code: error.code, documentId, userId })
      throw error
    }
    return data
  }

  /**
   * Validate that a document exists and is owned by the user.
   * This is a convenience method that combines getDocumentById with explicit ownership check.
   * @param documentId - The ID of the document
   * @param userId - The ID of the user
   * @returns The document if found and owned, null if not found or not owned
   */
  async validateDocumentOwnership(documentId: string, userId: string): Promise<Document | null> {
    return this.getDocumentById(documentId, userId)
  }
}
