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
            payroll_period_start: '01-01-2025',
            payroll_period_end: '31-01-2025',
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
          listUserDocumentsByStatus: jest.fn().mockResolvedValue({
            data: mockDocuments,
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            }
          }),
        }

        mockRequest = {
          query: {},
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        }

        await controller.getDocuments(mockRequest as Request, mockResponse as Response)

        expect(mockServiceInstance.listUserDocumentsByStatus).toHaveBeenCalledWith('user-123', null, 1, 10)
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockDocuments,
          meta: {
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
            timestamp: expect.any(String),
          }
        })
      })

      it('should return user documents with status filter', async () => {
        const mockDocuments: Document[] = [
          {
            id: 'doc-1',
            user_id: 'user-123',
            employee_id: 456,
            payroll_period_start: '01-01-2025',
            payroll_period_end: '31-01-2025',
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
          listUserDocumentsByStatus: jest.fn().mockResolvedValue({
            data: mockDocuments,
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            }
          }),
        }

        mockRequest = {
          query: { status: 'PENDING' },
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        }

        await controller.getDocuments(mockRequest as Request, mockResponse as Response)

        expect(mockServiceInstance.listUserDocumentsByStatus).toHaveBeenCalledWith('user-123', 'PENDING', 1, 10)
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockDocuments,
          meta: {
            pagination: {
              total: 1,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
            timestamp: expect.any(String),
          }
        })
      })

      it('should return user documents with pagination', async () => {
        const mockDocuments: Document[] = []

        const mockServiceInstance = {
          listUserDocumentsByStatus: jest.fn().mockResolvedValue({
            data: mockDocuments,
            pagination: {
              total: 25,
              page: 2,
              limit: 10,
              totalPages: 3,
              hasNextPage: true,
              hasPrevPage: true,
            }
          }),
        }

        mockRequest = {
          query: { page: '2', limit: '10' },
          user: { id: 'user-123' },
          documentService: mockServiceInstance as any,
        }

        await controller.getDocuments(mockRequest as Request, mockResponse as Response)

        expect(mockServiceInstance.listUserDocumentsByStatus).toHaveBeenCalledWith('user-123', null, 2, 10)
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockDocuments,
          meta: {
            pagination: {
              total: 25,
              page: 2,
              limit: 10,
              totalPages: 3,
              hasNextPage: true,
              hasPrevPage: true,
            },
            timestamp: expect.any(String),
          }
        })
      })

      it('should handle errors', async () => {
        const mockServiceInstance = {
          listUserDocumentsByStatus: jest.fn().mockRejectedValue(new Error('Service error')),
        }

        mockRequest = {
          query: {},
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
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
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
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockDocument,
          meta: {
            timestamp: expect.any(String),
          }
        })
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
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      mockDocumentService.uploadDocument = jest.fn().mockResolvedValue(mockUploadResponse)

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith({
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      })
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUploadResponse,
        meta: {
          timestamp: expect.any(String),
        }
      })
    })

    it('should return 400 when PDF file is missing', async () => {
      mockRequest = {
        file: undefined,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
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
          // missing employee_id and payroll_period fields
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'user_id, employee_id, payroll_period_start, and payroll_period_end are required' })
    })

    it('should return 400 for invalid date format', async () => {
      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period_start: 'invalid-format',
          payroll_period_end: '31-01-2025',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'payroll_period_start and payroll_period_end must be in DD-MM-YYYY format' })
    })

    it('should handle service errors with appropriate status codes', async () => {
      mockDocumentService.uploadDocument = jest.fn().mockRejectedValue(new Error('User not found'))

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
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
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unexpected error' })
    })

    it('should return 400 when start date is after end date', async () => {
      mockDocumentService.uploadDocument = jest.fn().mockRejectedValue(new Error('Payroll period start date must be before end date'))

      mockRequest = {
        file: { buffer: Buffer.from('test pdf') } as any,
        body: {
          user_id: 'user-123',
          employee_id: '456',
          payroll_period_start: '31-01-2025',
          payroll_period_end: '01-01-2025',
        },
      } as any

      await controller.uploadDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Payroll period start date must be before end date' })
    })
  })

  describe('signDocument', () => {
    it('should sign document successfully', async () => {
      const mockServiceInstance = {
        signDocument: jest.fn().mockResolvedValue(undefined),
      }

      mockRequest = {
        params: { id: 'doc-123' },
        user: { id: 'user-123', email: 'test@example.com' },
        body: {
          password: 'password123',
          fullName: 'John Doe',
          identificationNumber: '123456789',
        },
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Test Agent'),
        documentService: mockServiceInstance as any,
      } as any

      await controller.signDocument(mockRequest as Request, mockResponse as Response)

      expect(mockServiceInstance.signDocument).toHaveBeenCalledWith(
        'doc-123',
        'user-123',
        { password: 'password123', fullName: 'John Doe', identificationNumber: '123456789' },
        '192.168.1.1',
        'Test Agent',
        'test@example.com'
      )
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Document signed successfully' },
        meta: {
          timestamp: expect.any(String),
        }
      })
    })

    it('should return 404 when document not found', async () => {
      const mockServiceInstance = {
        signDocument: jest.fn().mockRejectedValue(new Error('Document not found')),
      }

      mockRequest = {
        params: { id: 'doc-123' },
        user: { id: 'user-123', email: 'test@example.com' },
        body: {
          password: 'password123',
          fullName: 'John Doe',
          identificationNumber: '123456789',
        },
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Test Agent'),
        documentService: mockServiceInstance as any,
      } as any

      await controller.signDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Document not found' })
    })

    it('should return 400 when document is already signed', async () => {
      const mockServiceInstance = {
        signDocument: jest.fn().mockRejectedValue(new Error('Document is already signed')),
      }

      mockRequest = {
        params: { id: 'doc-123' },
        user: { id: 'user-123', email: 'test@example.com' },
        body: {
          password: 'password123',
          fullName: 'John Doe',
          identificationNumber: '123456789',
        },
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Test Agent'),
        documentService: mockServiceInstance as any,
      } as any

      await controller.signDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Document is already signed' })
    })

    it('should return 401 when authentication fails', async () => {
      const mockServiceInstance = {
        signDocument: jest.fn().mockRejectedValue(new Error('Authentication failed')),
      }

      mockRequest = {
        params: { id: 'doc-123' },
        user: { id: 'user-123', email: 'test@example.com' },
        body: {
          password: 'wrongpassword',
          fullName: 'John Doe',
          identificationNumber: '123456789',
        },
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Test Agent'),
        documentService: mockServiceInstance as any,
      } as any

      await controller.signDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication failed' })
    })

    it('should handle generic errors with 500 status', async () => {
      const mockServiceInstance = {
        signDocument: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      }

      mockRequest = {
        params: { id: 'doc-123' },
        user: { id: 'user-123', email: 'test@example.com' },
        body: {
          password: 'password123',
          fullName: 'John Doe',
          identificationNumber: '123456789',
        },
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' } as any,
        get: jest.fn().mockReturnValue('Test Agent'),
        documentService: mockServiceInstance as any,
      } as any

      await controller.signDocument(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unexpected error' })
    })
  })
})
