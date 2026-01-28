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
      console.log(`[DocumentService] uploadDocument: Starting upload for user ${request.user_id}, period ${request.payroll_period_start} to ${request.payroll_period_end}`)

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

      // 3. Validate date range
      const [startDay, startMonth, startYear] = request.payroll_period_start.split('-').map(Number)
      const [endDay, endMonth, endYear] = request.payroll_period_end.split('-').map(Number)

      // Simple date range validation (year-month-day comparison)
      const startValue = startYear * 10000 + startMonth * 100 + startDay
      const endValue = endYear * 10000 + endMonth * 100 + endDay

      if (startValue >= endValue) {
        throw new Error('Payroll period start date must be before end date')
      }
      console.log(`[DocumentService] uploadDocument: Date range validated`)

      // 4. Compute SHA-256 hash
      const originalHash = HashUtil.sha256(request.pdf)
      console.log(`[DocumentService] uploadDocument: Computed hash ${originalHash}`)

      // 5. Check idempotency
      const existingDoc = await adminRepo.checkIdempotency(request.user_id, request.payroll_period_start, request.payroll_period_end, originalHash)
      if (existingDoc) {
        console.log(`[DocumentService] uploadDocument: Idempotent hit, returning existing document ${existingDoc.id}`)
        return {
          document_id: existingDoc.id,
          status: existingDoc.status as 'PENDING',
          payroll_period_start: existingDoc.payroll_period_start,
          payroll_period_end: existingDoc.payroll_period_end,
          idempotent: true
        }
      }

      // 6. Generate document ID
      const documentId = uuidv4()
      console.log(`[DocumentService] uploadDocument: Generated document ID ${documentId}`)

      // 7. Upload to GCS
      uploadedPath = `original/${request.user_id}/${documentId}.pdf`
      await GCSUtil.uploadPdf(uploadedPath, request.pdf)
      console.log(`[DocumentService] uploadDocument: Uploaded to GCS at ${uploadedPath}`)

      // 8. Insert document record
      const documentData = {
        id: documentId,
        user_id: request.user_id,
        employee_id: request.employee_id,
        payroll_period_start: request.payroll_period_start,
        payroll_period_end: request.payroll_period_end,
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
        payroll_period_start: insertedDoc.payroll_period_start,
        payroll_period_end: insertedDoc.payroll_period_end
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