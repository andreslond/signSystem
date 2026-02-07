import { createSupabaseAdminClient } from '../config/supabase'
import { Document } from '../types'

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
}