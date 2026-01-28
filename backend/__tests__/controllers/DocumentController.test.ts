import { Request, Response } from 'express'
import { DocumentController } from '../../src/controllers/DocumentController'
import { DocumentService } from '../../src/services/DocumentService'
import { Document, UploadDocumentRequest, UploadDocumentResponse } from '../../src/types'

// Mock DocumentService
jest.mock('../../src/services/DocumentService')

const mockDocumentService = DocumentService as jest.Mocked<typeof DocumentService>

describe('DocumentController', () => {
  let controller: DocumentController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let jsonSpy: jest.SpyInstance
  let statusSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new DocumentController()

    jsonSpy = jest.fn()
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy })

    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
    } as any
  })

  describe('User Methods', () => {
    describe('getDocuments', () => {
      it('should return user documents successfully', async () => {
        const mockDocuments: Document[] = [
          {
            id: 'doc-1',
            user_id: 'user-123',
            employee_id: 456,
            payroll_period: '2025-01',
            pdf_original_path: 'original/user-123/doc-1.pdf',
            pdf_signed_path: null,
            status: 'PENDING',
            original_hash: 'hash1',
            signed_hash: null,
            created_at: '2025-01-01T00:00:00Z',
            signed_at: null,
            superseded_by: null,
            is_active: true,
          },
        ]

        const mockServiceInstance = {
          listUserDocuments: jest.fn().mockResolvedValue(mockDocuments),
        }

        mockRequest = {
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        }

        await controller.getDocuments(mockRequest as Request, mockResponse as Response)

        expect(mockServiceInstance.listUserDocuments).toHaveBeenCalledWith('user-123')
        expect(mockResponse.json).toHaveBeenCalledWith(mockDocuments)
      })

      it('should handle errors', async () => {
        const mockServiceInstance = {
          listUserDocuments: jest.fn().mockRejectedValue(new Error('Service error')),
        }

        mockRequest = {
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        } as any

        await controller.getDocuments(mockRequest as Request, mockResponse as Response)

        expect(mockResponse.status).toHaveBeenCalledWith(500)
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Service error' })
      })
    })

    describe('getDocumentById', () => {
      it('should return document successfully', async () => {
        const mockDocument: Document = {
          id: 'doc-123',
          user_id: 'user-123',
          employee_id: 456,
          payroll_period: '2025-01',
          pdf_original_path: 'original/user-123/doc-123.pdf',
          pdf_signed_path: null,
          status: 'PENDING',
          original_hash: 'hash123',
          signed_hash: null,
          created_at: '2025-01-01T00:00:00Z',
          signed_at: null,
          superseded_by: null,
          is_active: true,
        }

        const mockServiceInstance = {
          getUserDocument: jest.fn().mockResolvedValue(mockDocument),
        }

        mockRequest = {
          params: { id: 'doc-123' },
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        } as any

        await controller.getDocumentById(mockRequest as Request, mockResponse as Response)

        expect(mockServiceInstance.getUserDocument).toHaveBeenCalledWith('doc-123', 'user-123')
        expect(mockResponse.json).toHaveBeenCalledWith(mockDocument)
      })

      it('should return 404 when document not found', async () => {
        const mockServiceInstance = {
          getUserDocument: jest.fn().mockResolvedValue(null),
        }

        mockRequest = {
          params: { id: 'doc-123' },
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        } as any

        await controller.getDocumentById(mockRequest as Request, mockResponse as Response)

        expect(mockResponse.status).toHaveBeenCalledWith(404)
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Document not found' })
      })
    })
  })

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockUploadResponse: UploadDocumentResponse = {
        document_id: 'doc-123',
        status: 'PENDING',
        payroll_period: '01-01-2025',
      }

      mockDocumentService.uploadDocument = jest.fn().mockResolvedValue(mockUploadResponse)

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period: '01-01-2025',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith({
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '01-01-2025',
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(mockUploadResponse)
    })

    it('should return 400 when PDF file is missing', async () => {
      mockRequest = {
        file: undefined,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period: '2025-01',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'PDF file is required' })
    })

    it('should return 400 when required fields are missing', async () => {
      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          // missing employee_id and payroll_period
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'user_id, employee_id, and payroll_period are required' })
    })

    it('should return 400 for invalid payroll_period format', async () => {
      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period: 'invalid-format',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'payroll_period must be in YYYY-MM format' })
    })

    it('should handle service errors with appropriate status codes', async () => {
      mockDocumentService.uploadDocument = jest.fn().mockRejectedValue(new Error('User not found'))

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period: '2025-01',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' })
    })

    it('should handle generic errors with 500 status', async () => {
      mockDocumentService.uploadDocument = jest.fn().mockRejectedValue(new Error('Unexpected error'))

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period: '2025-01',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unexpected error' })
    })
  })
})