import { DocumentUserRepository } from '../repositories/DocumentUserRepository'
import { DocumentAdminRepository } from '../repositories/DocumentAdminRepository'
import { Document, SignDocumentRequest, UploadDocumentRequest, UploadDocumentResponse, DocumentStatus, PaginationMeta, PaginatedDocumentsResponse, createPaginationMeta, PdfUrlResponse } from '../types'
import { GCSUtil } from '../utils/gcs'
import { PDFUtil, SignatureData } from '../utils/pdf'
import { HashUtil } from '../utils/hash'
import { DateUtil } from '../utils/date'
import { createSupabaseAdminClient } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'

/**
 * Default pagination settings
 */
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export class DocumentService {
  constructor(private userToken: string) {}

  private get documentUserRepository(): DocumentUserRepository {
    return new DocumentUserRepository(this.userToken)
  }

  private get documentAdminRepository(): DocumentAdminRepository {
    return new DocumentAdminRepository()
  }

  /**
   * Get paginated documents for a user with optional status filtering.
   * 
   * @param userId - The user ID
   * @param status - Optional status filter (PENDING, SIGNED, INVALIDATED)
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10, max: 50)
   * @returns Paginated documents response with metadata
   */
  async listUserDocumentsByStatus(
    userId: string,
    status: DocumentStatus | null,
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT
  ): Promise<PaginatedDocumentsResponse> {
    // Ensure limit doesn't exceed maximum
    const validLimit = Math.min(limit, MAX_LIMIT)
    
    // Calculate offset from page number
    const offset = (page - 1) * validLimit

    // Fetch documents and total count in parallel for efficiency
    const [documents, total] = await Promise.all([
      this.documentUserRepository.listDocumentsByUserAndStatus(userId, status, validLimit, offset),
      this.documentUserRepository.countDocumentsByUserAndStatus(userId, status)
    ])

    // Calculate total pages
    const totalPages = Math.ceil(total / validLimit)

    const pagination: PaginationMeta = {
      total,
      page,
      limit: validLimit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    console.log(`[DocumentService] listUserDocumentsByStatus: Retrieved ${documents.length} of ${total} documents for user ${userId}, status=${status || 'all'}, page=${page}, limit=${validLimit}`)

    return {
      data: documents,
      pagination
    }
  }

  /**
   * List all user documents (legacy method, kept for backward compatibility)
   * @param userId - The user ID
   * @returns Array of documents
   */
  async listUserDocuments(userId: string): Promise<Document[]> {
    return await this.documentUserRepository.listDocumentsByUser(userId)
  }

  async getUserDocument(documentId: string, userId: string): Promise<Document | null> {
    return await this.documentUserRepository.getDocumentByIdWithEmployee(documentId, userId)
  }

  /**
   * Get any document by ID (admin access - no ownership check).
   * Used by leader users who need to view all documents.
   * @param documentId - The document ID
   */
  async getAdminDocument(documentId: string): Promise<Document | null> {
    const supabase = createSupabaseAdminClient()
    
    // Get the document
    const { data: documentData, error: docError } = await supabase
      .schema('ar_signatures')
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()
    
    if (docError) {
      if (docError.code === 'PGRST116') return null
      console.error('[DocumentService] getAdminDocument: Failed to get document', { error: docError.message, documentId })
      throw docError
    }
    
    // If document has employee_id, fetch employee data separately
    if (documentData && documentData.employee_id) {
      const { data: employeeData, error: empError } = await supabase
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
      const { data: signatureData, error: sigError } = await supabase
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
   * Get a signed URL for any document's PDF (admin access - no ownership check).
   * Used by leader users who need to view all documents.
   * @param documentId - The document ID
   * @param expiresInSeconds - URL expiration time in seconds
   */
  async getAdminDocumentPdfUrl(
    documentId: string,
    expiresInSeconds: number = 3600
  ): Promise<PdfUrlResponse> {
    // 1. Get document using admin repository (RLS-bypassed)
    const document = await this.getAdminDocument(documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    // 2. If document is signed, return the signed PDF
    if (document.status === 'SIGNED') {
      if (!document.pdf_signed_path) {
        console.error(`[DocumentService] getAdminDocumentPdfUrl: Document ${documentId} is marked as SIGNED but has no signed PDF path`)
        throw new Error('Document is signed but signed PDF is not available')
      }
      
      const url = await GCSUtil.getSignedUrl(document.pdf_signed_path, expiresInSeconds)
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      
      return {
        documentId,
        url,
        expiresAt,
        pdfType: 'signed'
      }
    }

    // 3. For non-signed documents, return the original PDF
    const pdfPath = document.pdf_original_path
    const pdfType = 'original'

    console.log(`[DocumentService] getAdminDocumentPdfUrl: Generating ${pdfType} PDF URL for document ${documentId}`)

    // 4. Generate signed URL for the PDF
    const url = await GCSUtil.getSignedUrl(pdfPath, expiresInSeconds)

    // 5. Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    return {
      documentId,
      url,
      expiresAt,
      pdfType
    }
  }

  /**
   * Get a signed URL for a document's PDF.
   * Returns signed URL for the signed PDF if document is signed, otherwise returns original PDF URL.
   * 
   * @param documentId - The document ID
   * @param userId - The user ID (for authorization)
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns PdfUrlResponse with signed URL and metadata
   */
  async getDocumentPdfUrl(
    documentId: string,
    userId: string,
    expiresInSeconds: number = 3600
  ): Promise<PdfUrlResponse> {
    // 1. Get document and validate ownership using user repository (RLS-enforced)
    const document = await this.documentUserRepository.getDocumentById(documentId, userId)
    if (!document) {
      throw new Error('Document not found')
    }

    // 2. If document is signed, we MUST return the signed PDF
    // If signed PDF path is not available, throw an error
    if (document.status === 'SIGNED') {
      if (!document.pdf_signed_path) {
        console.error(`[DocumentService] getDocumentPdfUrl: Document ${documentId} is marked as SIGNED but has no signed PDF path`)
        throw new Error('Document is signed but signed PDF is not available')
      }
      
      const url = await GCSUtil.getSignedUrl(document.pdf_signed_path, expiresInSeconds)
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      
      return {
        documentId,
        url,
        expiresAt,
        pdfType: 'signed'
      }
    }

    // 3. For non-signed documents, return the original PDF
    const pdfPath = document.pdf_original_path
    const pdfType = 'original'

    console.log(`[DocumentService] getDocumentPdfUrl: Generating ${pdfType} PDF URL for document ${documentId}`)

    // 4. Generate signed URL for the PDF
    const url = await GCSUtil.getSignedUrl(pdfPath, expiresInSeconds)

    // 5. Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    return {
      documentId,
      url,
      expiresAt,
      pdfType
    }
  }

  async signDocument(
    documentId: string,
    userId: string,
    request: SignDocumentRequest,
    ip: string,
    userAgent: string,
    userEmail: string
  ): Promise<void> {
    // 1. Get document and validate ownership and status using user repository (RLS-enforced)
    const document = await this.documentUserRepository.getDocumentById(documentId, userId)
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
    if (authError) {
      console.error(`[DocumentService] signDocument: Authentication failed for user ${userEmail} - ${authError.message}`)
      if (authError.message.includes('Invalid login credentials') || authError.message.includes('wrong password') || authError.message.includes('Invalid password')) {
        throw new Error('Contraseña incorrecta')
      }
      throw new Error('Authentication failed')
    }
    if (!authData.user) {
      throw new Error('Authentication failed')
    }

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
    let signedPathUploaded: string | null = null

    try {
      await GCSUtil.uploadPdf(signedPath, signedPdfBuffer)
      signedPathUploaded = signedPath
      console.log(`[DocumentService] signDocument: Uploaded signed PDF to ${signedPath}`)

      // 9. Insert signature record using admin repository (RLS-bypassed)
      const signedAt = new Date().toISOString()

      console.log(`[DocumentService] signDocument: Inserting signature record for document ${documentId} by user ${userId}`)
      await this.documentAdminRepository.insertSignature({
        document_id: documentId,
        name: request.fullName,
        identification_number: request.identificationNumber,
        ip,
        user_agent: userAgent,
        hash_sign: signedHash,
        signed_at: signedAt
      })

      // 10. Update document as signed using admin repository (RLS-bypassed)
      await this.documentAdminRepository.updateDocumentAsSigned(documentId, signedHash, signedAt, signedPath)
      console.log(`[DocumentService] signDocument: Document ${documentId} signed successfully`)
    } catch (error) {
      // Rollback: delete signed PDF from GCS if it was uploaded
      if (signedPathUploaded) {
        try {
          await GCSUtil.deletePdf(signedPathUploaded)
          console.log(`[DocumentService] signDocument: Rolled back GCS file ${signedPathUploaded}`)
        } catch (rollbackError) {
          console.error(`[DocumentService] signDocument: Failed to rollback GCS file - ${(rollbackError as Error).message}`)
        }
      }
      console.error(`[DocumentService] signDocument: Error during signing - ${(error as Error).message}`)
      throw error
    }
  }

  static async uploadDocument(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const adminRepo = new DocumentAdminRepository()
    let uploadedPath: string | null = null

    // Convert dates from DD-MM-YYYY to MM-DD-YYYY for PostgreSQL
    const payrollPeriodStartPostgres = DateUtil.toPostgresFormat(request.payroll_period_start)
    const payrollPeriodEndPostgres = DateUtil.toPostgresFormat(request.payroll_period_end)

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

      // 3. Validate date range (using DD-MM-YYYY format)
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

      // 5. Check idempotency (using PostgreSQL date format)
      const existingDoc = await adminRepo.checkIdempotency(
        request.user_id,
        payrollPeriodStartPostgres,
        payrollPeriodEndPostgres,
        originalHash
      )
      if (existingDoc) {
        console.log(`[DocumentService] uploadDocument: Idempotent hit, returning existing document ${existingDoc.id}`)
        return {
          document_id: existingDoc.id,
          status: existingDoc.status as 'PENDING',
          // Return dates in DD-MM-YYYY format
          payroll_period_start: DateUtil.fromPostgresFormat(existingDoc.payroll_period_start),
          payroll_period_end: DateUtil.fromPostgresFormat(existingDoc.payroll_period_end),
          idempotent: true
        }
      }

      // 6. Generate document ID
      const documentId = uuidv4()
      console.log(`[DocumentService] uploadDocument: Generated document ID ${documentId}`)

      // 7. Insert document record first (so it exists before we set superseded_by on old docs)
      // Use empty string for pdf_original_path, will update after GCS upload
      const documentData = {
        id: documentId,
        user_id: request.user_id,
        employee_id: request.employee_id,
        payroll_period_start: payrollPeriodStartPostgres,
        payroll_period_end: payrollPeriodEndPostgres,
        pdf_original_path: '', // Will be updated after GCS upload
        status: 'PENDING' as const,
        original_hash: originalHash,
        superseded_by: null,
        is_active: true,
        amount: Number(request.amount) || 0
      }

      const insertedDoc = await adminRepo.insertDocument(documentData)
      console.log(`[DocumentService] uploadDocument: Inserted document record ${insertedDoc.id}`)

      // 8. Mark old documents as superseded now that the new document exists
      console.log(`[DocumentService] uploadDocument: Calling supersedeOldDocuments with user_id=${request.user_id}, payrollPeriodStartPostgres=${payrollPeriodStartPostgres}, payrollPeriodEndPostgres=${payrollPeriodEndPostgres}, newDocumentId=${documentId}`)
      await adminRepo.supersedeOldDocuments(
        request.user_id,
        payrollPeriodStartPostgres,
        payrollPeriodEndPostgres,
        documentId
      )

      // 9. Upload to GCS
      uploadedPath = `original/${request.user_id}/${documentId}.pdf`
      await GCSUtil.uploadPdf(uploadedPath, request.pdf)
      console.log(`[DocumentService] uploadDocument: Uploaded to GCS at ${uploadedPath}`)

      // 10. Update document with GCS path
      const { error: updateError } = await adminRepo.updateDocumentPath(documentId, uploadedPath)

      if (updateError) {
        console.error(`[DocumentService] uploadDocument: Failed to update GCS path - ${updateError.message}`)
      }

      return {
        document_id: insertedDoc.id,
        status: insertedDoc.status as 'PENDING',
        // Return dates in DD-MM-YYYY format
        payroll_period_start: DateUtil.fromPostgresFormat(insertedDoc.payroll_period_start),
        payroll_period_end: DateUtil.fromPostgresFormat(insertedDoc.payroll_period_end)
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
