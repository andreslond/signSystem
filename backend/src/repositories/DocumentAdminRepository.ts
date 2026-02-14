import { createSupabaseAdminClient } from '../config/supabase'
import { Document, SignatureData } from '../types'

/**
 * DocumentAdminRepository - Admin-context repository for document operations.
 * 
 * Responsibilities:
 * - Perform all INSERT/UPDATE operations related to:
 *   - ar_signatures.signatures
 *   - ar_signatures.documents
 * - Use a Supabase client initialized with the service_role key
 * - Assume RLS is bypassed
 * - Not accept user JWTs
 */
export class DocumentAdminRepository {
  private get supabaseClient() {
    return createSupabaseAdminClient()
  }

  async checkUserExists(userId: string): Promise<{ employee_id: number } | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('profiles')
      .select('employee_id')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows
      throw error
    }
    return data
  }

  async checkIdempotency(userId: string, payrollPeriodStart: string, payrollPeriodEnd: string, originalHash: string): Promise<Document | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('payroll_period_start', payrollPeriodStart)
      .eq('payroll_period_end', payrollPeriodEnd)
      .eq('original_hash', originalHash)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows
      throw error
    }
    return data
  }

  async insertDocument(documentData: Omit<Document, 'id' | 'created_at' | 'signed_at' | 'pdf_signed_path' | 'signed_hash'>): Promise<Document> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Mark old documents as superseded when a new version is uploaded
   * Updates is_active = false and superseded_by = newDocumentId for documents
   * with the same user_id and period range
   */
  async supersedeOldDocuments(userId: string, payrollPeriodStart: string, payrollPeriodEnd: string, newDocumentId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .update({
        is_active: false,
        superseded_by: newDocumentId,
        status: 'INVALIDATED' as const
      })
      .eq('user_id', userId)
      .eq('payroll_period_start', payrollPeriodStart)
      .eq('payroll_period_end', payrollPeriodEnd)
      .eq('is_active', true)

    if (error) {
      console.warn(`[DocumentAdminRepository] supersedeOldDocuments: Could not update old documents - ${error.message}`)
      // Don't throw - this is not a critical error, the new document was already inserted
    } else {
      console.log(`[DocumentAdminRepository] supersedeOldDocuments: Marked old documents as superseded for user ${userId} in period ${payrollPeriodStart} to ${payrollPeriodEnd}`)
    }
  }

  /**
   * Insert a signature record for a signed document.
   * Uses service_role to bypass RLS.
   * @param signatureData - The signature data to insert
   */
  async insertSignature(signatureData: SignatureData): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('signatures')
      .insert(signatureData)

    if (error) {
      console.error('[DocumentAdminRepository] insertSignature: Failed to insert signature', { error: error.message, code: error.code, signatureData })
      throw error
    }
    console.log(`[DocumentAdminRepository] insertSignature: Inserted signature for document ${signatureData.document_id}`)
  }

  /**
   * Update a document as signed.
   * Uses service_role to bypass RLS.
   * @param documentId - The ID of the document to update
   * @param signedHash - The hash of the signed PDF
   * @param signedAt - The timestamp when the document was signed
   * @param signedPdfPath - The GCS path to the signed PDF
   */
  async updateDocumentAsSigned(documentId: string, signedHash: string, signedAt: string, signedPdfPath: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .update({
        status: 'SIGNED',
        signed_hash: signedHash,
        signed_at: signedAt,
        pdf_signed_path: signedPdfPath
      })
      .eq('id', documentId)

    if (error) {
      console.error('[DocumentAdminRepository] updateDocumentAsSigned: Failed to update document', { error: error.message, code: error.code, documentId })
      throw error
    }
    console.log(`[DocumentAdminRepository] updateDocumentAsSigned: Updated document ${documentId} as signed with PDF path ${signedPdfPath}`)
  }
}