import { createSupabaseUserClient } from '../config/supabase'
import { Document, SignatureData } from '../types'


export class DocumentRepository {
  constructor(private userToken: string) {}

  private get supabaseClient() {
    return createSupabaseUserClient(this.userToken)
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    const { data, error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
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
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  }

  async insertSignature(signatureData: SignatureData): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('signatures')
      .insert(signatureData)

    if (error) throw error
  }

  async updateDocumentAsSigned(documentId: string, signedHash: string, signedAt: string): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('ar_signatures')
      .from('documents')
      .update({
        status: 'SIGNED',
        signed_hash: signedHash,
        signed_at: signedAt
      })
      .eq('id', documentId)

    if (error) throw error
  }
}