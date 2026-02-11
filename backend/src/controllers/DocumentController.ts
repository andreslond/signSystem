import { Request, Response } from 'express'
import { DocumentService } from '../services/DocumentService'
import { SignDocumentRequest, UploadDocumentRequest, UploadDocumentResponse, ALLOWED_DOCUMENT_STATUSES, DocumentStatus } from '../types'
import { sendSuccess, sendCreated } from '../utils/apiError'

// Pagination defaults and limits
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

declare global {
  namespace Express {
    interface Request {
      documentService: DocumentService
    }
  }
}

/**
 * Validate status query parameter
 * @param status - Status value from query
 * @returns Normalized status or null if not provided
 * @throws Error if status is invalid
 */
function validateStatus(status: string | undefined): DocumentStatus | null {
  if (!status || status.trim() === '') {
    return null
  }
  
  // Normalize to uppercase for validation
  const normalizedStatus = status.trim().toUpperCase()
  
  // Strict validation - only allow specific values
  if (!ALLOWED_DOCUMENT_STATUSES.includes(normalizedStatus as DocumentStatus)) {
    throw new Error(`Invalid status. Allowed values: ${ALLOWED_DOCUMENT_STATUSES.join(', ')}`)
  }
  
  return normalizedStatus as DocumentStatus
}

/**
 * Validate pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 * @returns Validated { page, limit }
 * @throws Error if parameters are invalid
 */
function validatePagination(page: string | undefined, limit: string | undefined): { page: number; limit: number } {
  const pageNum = page ? parseInt(page, 10) : DEFAULT_PAGE
  const limitNum = limit ? parseInt(limit, 10) : DEFAULT_LIMIT
  
  // Validate page number
  if (isNaN(pageNum) || pageNum < 1) {
    throw new Error('Page must be a positive integer')
  }
  
  // Validate limit
  if (isNaN(limitNum) || limitNum < 1 || limitNum > MAX_LIMIT) {
    throw new Error(`Limit must be between 1 and ${MAX_LIMIT}`)
  }
  
  return { page: pageNum, limit: limitNum }
}

export class DocumentController {
  /**
   * GET /documents
   * List documents with optional status filtering and pagination
   */
  getDocuments = async (req: Request, res: Response) => {
    try {
      // Extract and validate query parameters
      const { status: statusParam, page: pageParam, limit: limitParam } = req.query
      
      // Validate status (throws on invalid)
      const status = validateStatus(statusParam as string)
      
      // Validate pagination (throws on invalid)
      const { page, limit } = validatePagination(pageParam as string, limitParam as string)
      
      console.log(`[DocumentController] getDocuments: userId=${req.user.id}, status=${status || 'all'}, page=${page}, limit=${limit}`)
      
      // Use the new paginated service method
      const response = await req.documentService.listUserDocumentsByStatus(
        req.user.id,
        status,
        page,
        limit
      )
      
      console.log(`[DocumentController] getDocuments: Retrieved ${response.data.length} of ${response.pagination.total} documents`)
      
      // Return standardized API response with data and pagination metadata
      return sendSuccess(res, response.data, { pagination: response.pagination })
    } catch (error: any) {
      console.error(`[DocumentController] getDocuments: Error - ${error.message}`)
      
      // Handle validation errors with 400 Bad Request
      if (error.message.includes('Invalid status') || 
          error.message.includes('Page must be') || 
          error.message.includes('Limit must be')) {
        return res.status(400).json({ error: error.message })
      }
      
      res.status(500).json({ error: error.message })
    }
  }

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const document = await req.documentService.getUserDocument(req.params.id as string, req.user.id)
      if (!document) {
        console.log(`[DocumentController] getDocumentById: Document ${req.params.id} not found for user ${req.user.id}`)
        return res.status(404).json({ error: 'Document not found' })
      }
      console.log(`[DocumentController] getDocumentById: Retrieved document ${req.params.id} for user ${req.user.id}`)
      
      // Return standardized API response
      return sendSuccess(res, document)
    } catch (error: any) {
      console.error(`[DocumentController] getDocumentById: Error - ${error.message}`)
      res.status(500).json({ error: error.message })
    }
  }

  signDocument = async (req: Request, res: Response) => {
    try {
      const signRequest: SignDocumentRequest = req.body
      const ip = req.ip || req.connection.remoteAddress || 'unknown'
      const userAgent = req.get('User-Agent') || 'unknown'

      await req.documentService.signDocument(
        req.params.id as string,
        req.user.id,
        signRequest,
        ip,
        userAgent,
        req.user.email
      )

      console.log(`[DocumentController] signDocument: Document ${req.params.id} signed successfully for user ${req.user.id}`)
      
      // Return standardized API response
      return sendSuccess(res, { message: 'Document signed successfully' })
    } catch (error: any) {
      console.error(`[DocumentController] signDocument: Error - ${error.message}`)
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('already signed') ? 400 :
                        error.message.includes('Authentication failed') ? 401 : 500
      res.status(statusCode).json({ error: error.message })
    }
  }

  uploadDocument = async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const { user_id, employee_id, payroll_period_start, payroll_period_end } = req.body
      const pdfFile = (req as any).file

      if (!pdfFile || !pdfFile.buffer) {
        return res.status(400).json({ error: 'PDF file is required' })
      }
      if (!user_id || !employee_id || !payroll_period_start || !payroll_period_end) {
        return res.status(400).json({ error: 'user_id, employee_id, payroll_period_start, and payroll_period_end are required' })
      }

      // Validate date format (DD-MM-YYYY)
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/
      if (!dateRegex.test(payroll_period_start) || !dateRegex.test(payroll_period_end)) {
        return res.status(400).json({ error: 'payroll_period_start and payroll_period_end must be in DD-MM-YYYY format' })
      }

      const uploadRequest: UploadDocumentRequest = {
        pdf: pdfFile.buffer,
        user_id,
        employee_id: parseInt(employee_id, 10),
        payroll_period_start,
        payroll_period_end
      }

      console.log(`[DocumentController] uploadDocument: Processing upload for user ${user_id}, period ${payroll_period_start} to ${payroll_period_end}`)

      const response: UploadDocumentResponse = await DocumentService.uploadDocument(uploadRequest)

      console.log(`[DocumentController] uploadDocument: Successfully uploaded document ${response.document_id}`)
      
      // Return standardized API response with created status
      return sendCreated(res, response)

    } catch (error: any) {
      console.error(`[DocumentController] uploadDocument: Error - ${error.message}`)
      const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('does not match') ? 400 :
                          error.message.includes('must be before') ? 400 :
                          error.message.includes('already exists') ? 409 : 500
      res.status(statusCode).json({ error: error.message })
    }
  }
}
