import { DocumentRepository } from '../repositories/DocumentRepository'
import { Document, SignDocumentRequest } from '../types'
import { GCSUtil } from '../utils/gcs'
import { PDFUtil, SignatureData } from '../utils/pdf'
import { HashUtil } from '../utils/hash'
import { createSupabaseAdminClient } from '../config/supabase'

export class DocumentService {
  constructor(private userToken: string) {}

  private get documentRepository(): DocumentRepository {
    return new DocumentRepository(this.userToken)
  }

  async listUserDocuments(userId: string): Promise<Document[]> {
    return await this.documentRepository.getDocumentsByUser(userId)
  }

  async getUserDocument(documentId: string, userId: string): Promise<Document | null> {
    return await this.documentRepository.getDocumentById(documentId, userId)
  }

  async signDocument(
    documentId: string,
    userId: string,
    request: SignDocumentRequest,
    ip: string,
    userAgent: string,
    userEmail: string
  ): Promise<void> {
    // 1. Get document and validate ownership and status
    const document = await this.documentRepository.getDocumentById(documentId, userId)
    if (!document) {
      throw new Error('Document not found')
    }
    if (document.status === 'SIGNED') {
      throw new Error('Document is already signed')
    }

    // 2. Re-authenticate user with Supabase
    const { data: authData, error: authError } = await createSupabaseAdminClient().auth.signInWithPassword({
      email: userEmail,
      password: request.password
    })
    if (authError || !authData.user) {
      throw new Error('Authentication failed')
    }

    // TODO: Phase III - Get user profile and validate fullName and identificationNumber against database
    // TODO: Phase III - Implement audit logging for all signature operations
    // TODO: Phase III - Add document download/streaming endpoints
    // TODO: Phase III - Implement document status change notifications

    // 3. Download original PDF from GCS
    const originalPdfBuffer = await GCSUtil.downloadPdf(document.pdf_original_path)

    // 4. Generate SHA-256 hash of original PDF
    const originalHash = HashUtil.sha256(originalPdfBuffer)

    // 5. Create signature data
    const signatureData: SignatureData = {
      fullName: request.fullName,
      identificationNumber: request.identificationNumber,
      signingTimestamp: new Date().toISOString(),
      ipAddress: ip,
      originalPdfHash: originalHash
    }
    console.log(`[DocumentService] signDocument: Created signature data`)
    console.table(signatureData)

    // 6. Append signature block to PDF
    const signedPdfBuffer = await PDFUtil.appendSignatureBlock(originalPdfBuffer, signatureData)

    // 7. Generate hash of signed PDF
    const signedHash = HashUtil.sha256(signedPdfBuffer)
    console.log(`[DocumentService] signDocument: Generated signed PDF hash - ${signedHash}`)

    // 8. Upload signed PDF to GCS
    const signedPath = `signed/${userId}/${documentId}.pdf`
    await GCSUtil.uploadPdf(signedPath, signedPdfBuffer)

    // 9. Insert signature record
    const signedAt = new Date().toISOString()

    console.log(`[DocumentService] signDocument: Inserting signature record for document ${documentId} by user ${userId}`)
    await this.documentRepository.insertSignature({
      document_id: documentId,
      name: request.fullName,
      identification_number: request.identificationNumber,
      ip,
      user_agent: userAgent,
      hash_sign: signedHash,
      signed_at: signedAt
    })

    // 10. Update document as signed
    await this.documentRepository.updateDocumentAsSigned(documentId, signedHash, signedAt)
  }
}