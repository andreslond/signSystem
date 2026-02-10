import { createSupabaseUserClient } from '../config/supabase'
import { Document } from '../types'
import Logger from '../utils/logger'

/**
 * DocumentUserRepository - User-context repository for document read operations.
 * 
 * Responsibilities:
 * - Read data owned by the authenticated user
 * - Use a Supabase client initialized with the user JWT
 * - Rely on RLS for access control
 * - NEVER write to the database
 */
export class DocumentUserRepository {
  constructor(private userToken: string) {}

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  /**
   * Get all documents for a user
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
