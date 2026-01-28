import { DocumentRepository } from '../repositories/DocumentRepository'
import { DocumentAdminRepository } from '../repositories/DocumentAdminRepository'
import { Document, SignDocumentRequest, UploadDocumentRequest, UploadDocumentResponse } from '../types'
import { GCSUtil } from '../utils/gcs'
import { PDFUtil, SignatureData } from '../utils/pdf'
import { HashUtil } from '../utils/hash'
import { createSupabaseAdminClient } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'

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

  static async uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const adminRepo = new DocumentAdminRepository()
    let uploadedPath: string | null = null

    try {
      console.log(`[DocumentService] uploadDocument: Starting upload for user ${request.user_id}, period ${request.payroll_period}`)

      // 1. Validate user exists
      const profile = await adminRepo.checkUserExists(request.user_id)
      if (!profile) {
        throw new Error('User not found')
      }
      console.log(`[DocumentService] uploadDocument: User exists, employee_id ${profile.employee_id}`)

      // 2. Verify employee_id matches
      if (profile.employee_id !== request.employee_id) {
        throw new Error('Employee ID does not match user profile')
      }
      console.log(`[DocumentService] uploadDocument: Employee ID matches`)

      // 3. Compute SHA-256 hash
      const originalHash = HashUtil.sha256(request.pdf)
      console.log(`[DocumentService] uploadDocument: Computed hash ${originalHash}`)

      // 4. Check idempotency
      const existingDoc = await adminRepo.checkIdempotency(request.user_id, request.payroll_period, originalHash)
      if (existingDoc) {
        console.log(`[DocumentService] uploadDocument: Idempotent hit, returning existing document ${existingDoc.id}`)
        return {
          document_id: existingDoc.id,
          status: existingDoc.status as 'PENDING',
          payroll_period: existingDoc.payroll_period,
          idempotent: true
        }
      }

      // 5. Generate document ID
      const documentId = uuidv4()
      console.log(`[DocumentService] uploadDocument: Generated document ID ${documentId}`)

      // 6. Upload to GCS
      uploadedPath = `original/${request.user_id}/${documentId}.pdf`
      await GCSUtil.uploadPdf(uploadedPath, request.pdf)
      console.log(`[DocumentService] uploadDocument: Uploaded to GCS at ${uploadedPath}`)

      // 7. Insert document record
      const documentData = {
        id: documentId,
        user_id: request.user_id,
        employee_id: request.employee_id,
        payroll_period: request.payroll_period,
        pdf_original_path: uploadedPath,
        status: 'PENDING' as const,
        original_hash: originalHash,
        superseded_by: null,
        is_active: true
      }

      const insertedDoc = await adminRepo.insertDocument(documentData)
      console.log(`[DocumentService] uploadDocument: Inserted document record ${insertedDoc.id}`)

      return {
        document_id: insertedDoc.id,
        status: insertedDoc.status as 'PENDING',
        payroll_period: insertedDoc.payroll_period
      }

    } catch (error) {
      console.error(`[DocumentService] uploadDocument: Error - ${(error as Error).message}`)

      // Rollback: delete uploaded file if it was uploaded
      if (uploadedPath) {
        try {
          await GCSUtil.deletePdf(uploadedPath)
          console.log(`[DocumentService] uploadDocument: Rolled back GCS file ${uploadedPath}`)
        } catch (rollbackError) {
          console.error(`[DocumentService] uploadDocument: Failed to rollback GCS file - ${(rollbackError as Error).message}`)
        }
      }

      throw error
    }
  }
}