import { createSupabaseAdminClient } from '../config/supabase'
import { Document, UploadDocumentRequest } from '../types'

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

  async checkIdempotency(userId: string, payrollPeriod: string, originalHash: string): Promise<Document | null> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('payroll_period', payrollPeriod)
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
}