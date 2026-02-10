import { createSupabaseUserClient, createSupabaseAdminClient } from '../config/supabase'
import { Document, SignatureData } from '../types'
import Logger from '../utils/logger'


export class DocumentRepository {
  constructor(private userToken: string) {}

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  private get supabaseAdminClient() {
    return createSupabaseAdminClient()
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
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

  async insertSignature(signatureData: SignatureData): Promise<void> {
    const { error } = await this.supabaseAdminClient
      .schema('ar_signatures')
      .from('signatures')
      .insert(signatureData)

    if (error) {
      Logger.error('Failed to insert signature', { error: error.message, code: error.code, signatureData })
      throw error
    }
  }

  async updateDocumentAsSigned(documentId: string, signedHash: string, signedAt: string): Promise<void> {
    const { error } = await this.supabaseAdminClient
      .schema('ar_signatures')
      .from('documents')
      .update({
        status: 'SIGNED',
        signed_hash: signedHash,
        signed_at: signedAt
      })
      .eq('id', documentId)

    if (error) {
      Logger.error('Failed to update document as signed', { error: error.message, code: error.code, documentId })
      throw error
    }
  }
}
