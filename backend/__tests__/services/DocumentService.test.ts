import { DocumentService } from '../../src/services/DocumentService'
import { DocumentUserRepository } from '../../src/repositories/DocumentUserRepository'
import { DocumentAdminRepository } from '../../src/repositories/DocumentAdminRepository'
import { GCSUtil } from '../../src/utils/gcs'
import { PDFUtil } from '../../src/utils/pdf'
import { HashUtil } from '../../src/utils/hash'
import { Document, UploadDocumentRequest, SignDocumentRequest } from '../../src/types'
import { createSupabaseAdminClient } from '../../src/config/supabase'

// Mock dependencies
jest.mock('../../src/repositories/DocumentUserRepository')
jest.mock('../../src/repositories/DocumentAdminRepository')
jest.mock('../../src/utils/gcs')
jest.mock('../../src/utils/pdf')
jest.mock('../../src/utils/hash')
jest.mock('../../src/config/supabase')
jest.mock('uuid', () => ({ v4: jest.fn() }))

const mockDocumentUserRepository = DocumentUserRepository as jest.MockedClass<typeof DocumentUserRepository>
const mockDocumentAdminRepository = DocumentAdminRepository as jest.MockedClass<typeof DocumentAdminRepository>
const mockGCSUtil = GCSUtil as jest.Mocked<typeof GCSUtil>
const mockPDFUtil = PDFUtil as jest.Mocked<typeof PDFUtil>
const mockHashUtil = HashUtil as jest.Mocked<typeof HashUtil>
const mockCreateSupabaseAdminClient = createSupabaseAdminClient as jest.MockedFunction<typeof createSupabaseAdminClient>
const { v4: mockUuidV4 } = require('uuid')

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Methods', () => {
    it('listUserDocuments should return user documents', async () => {
      const service = new DocumentService('test-token')
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

      const mockRepoInstance = {
        listDocumentsByUser: jest.fn().mockResolvedValue(mockDocuments),
      } as any

      mockDocumentUserRepository.mockImplementation(() => mockRepoInstance)

      const result = await service.listUserDocuments('user-123')

      expect(mockRepoInstance.listDocumentsByUser).toHaveBeenCalledWith('user-123')
      expect(result).toEqual(mockDocuments)
    })

    it('getUserDocument should return user document', async () => {
      const service = new DocumentService('test-token')
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

      const mockRepoInstance = {
        getDocumentByIdWithEmployee: jest.fn().mockResolvedValue(mockDocument),
      } as any

      mockDocumentUserRepository.mockImplementation(() => mockRepoInstance)

      const result = await service.getUserDocument('doc-123', 'user-123')

      expect(mockRepoInstance.getDocumentByIdWithEmployee).toHaveBeenCalledWith('doc-123', 'user-123')
      expect(result).toEqual(mockDocument)
    })

    describe('getDocumentPdfUrl', () => {
      it('should return signed URL for original PDF when document is PENDING', async () => {
        const service = new DocumentService('test-token')
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

        const mockSignedUrl = 'https://storage.googleapis.com/test-bucket/original/user-123/doc-123.pdf?signature=abc123'

        const mockUserRepoInstance = {
          getDocumentById: jest.fn().mockResolvedValue(mockDocument),
        } as any
        mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

        mockGCSUtil.getSignedUrl.mockResolvedValue(mockSignedUrl)

        const result = await service.getDocumentPdfUrl('doc-123', 'user-123')

        expect(mockUserRepoInstance.getDocumentById).toHaveBeenCalledWith('doc-123', 'user-123')
        expect(mockGCSUtil.getSignedUrl).toHaveBeenCalledWith('original/user-123/doc-123.pdf', 3600)
        expect(result).toEqual({
          documentId: 'doc-123',
          url: mockSignedUrl,
          expiresAt: expect.any(String),
          pdfType: 'original'
        })
      })

      it('should return signed URL for signed PDF when document is SIGNED', async () => {
        const service = new DocumentService('test-token')
        const mockDocument: Document = {
          id: 'doc-123',
          user_id: 'user-123',
          employee_id: 456,
          payroll_period_start: '01-01-2025',
          payroll_period_end: '31-01-2025',
          pdf_original_path: 'original/user-123/doc-123.pdf',
          pdf_signed_path: 'signed/user-123/doc-123.pdf',
          status: 'SIGNED',
          original_hash: 'hash123',
          signed_hash: 'signed_hash456',
          created_at: '2025-01-01T00:00:00Z',
          signed_at: '2025-01-02T00:00:00Z',
          superseded_by: null,
          is_active: true,
        }

        const mockSignedUrl = 'https://storage.googleapis.com/test-bucket/signed/user-123/doc-123.pdf?signature=xyz789'

        const mockUserRepoInstance = {
          getDocumentById: jest.fn().mockResolvedValue(mockDocument),
        } as any
        mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

        mockGCSUtil.getSignedUrl.mockResolvedValue(mockSignedUrl)

        const result = await service.getDocumentPdfUrl('doc-123', 'user-123')

        expect(mockUserRepoInstance.getDocumentById).toHaveBeenCalledWith('doc-123', 'user-123')
        expect(mockGCSUtil.getSignedUrl).toHaveBeenCalledWith('signed/user-123/doc-123.pdf', 3600)
        expect(result).toEqual({
          documentId: 'doc-123',
          url: mockSignedUrl,
          expiresAt: expect.any(String),
          pdfType: 'signed'
        })
      })

      it('should throw error when document not found', async () => {
        const service = new DocumentService('test-token')

        const mockUserRepoInstance = {
          getDocumentById: jest.fn().mockResolvedValue(null),
        } as any
        mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

        await expect(
          service.getDocumentPdfUrl('doc-123', 'user-123')
        ).rejects.toThrow('Document not found')
      })

      it('should use custom expiration time', async () => {
        const service = new DocumentService('test-token')
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

        const mockUserRepoInstance = {
          getDocumentById: jest.fn().mockResolvedValue(mockDocument),
        } as any
        mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

        mockGCSUtil.getSignedUrl.mockResolvedValue('https://example.com/signed-url')

        await service.getDocumentPdfUrl('doc-123', 'user-123', 7200)

        expect(mockGCSUtil.getSignedUrl).toHaveBeenCalledWith('original/user-123/doc-123.pdf', 7200)
      })
    })
  })

  describe('signDocument', () => {
    it('should sign document successfully', async () => {
      const service = new DocumentService('test-token')
      const mockDocument: Document = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'original_hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      // Mock the signInWithPassword to return { data, error }
      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(mockDocument),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      const mockAdminRepoInstance = {
        insertSignature: jest.fn().mockResolvedValue(undefined),
        updateDocumentAsSigned: jest.fn().mockResolvedValue(undefined),
      } as any
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance)

      mockGCSUtil.downloadPdf.mockResolvedValue(Buffer.from('original pdf'))
      mockHashUtil.sha256.mockReturnValue('original_hash')
      mockPDFUtil.appendSignatureBlock.mockResolvedValue(Buffer.from('signed pdf'))
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)

      await service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')

      expect(mockUserRepoInstance.getDocumentById).toHaveBeenCalledWith('doc-123', 'user-123')
      expect(mockSignInWithPassword).toHaveBeenCalled()
      expect(mockGCSUtil.downloadPdf).toHaveBeenCalledWith('original/user-123/doc-123.pdf')
      expect(mockGCSUtil.uploadPdf).toHaveBeenCalled()
      expect(mockAdminRepoInstance.insertSignature).toHaveBeenCalled()
      expect(mockAdminRepoInstance.updateDocumentAsSigned).toHaveBeenCalled()
    })

    it('should throw error when document not found', async () => {
      const service = new DocumentService('test-token')
      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(null),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      await expect(
        service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')
      ).rejects.toThrow('Document not found')
    })

    it('should throw error when document is already signed', async () => {
      const service = new DocumentService('test-token')
      const mockDocument: Document = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        pdf_signed_path: 'signed/user-123/doc-123.pdf',
        status: 'SIGNED',
        original_hash: 'original_hash',
        signed_hash: 'signed_hash',
        created_at: '2025-01-01T00:00:00Z',
        signed_at: '2025-01-02T00:00:00Z',
        superseded_by: null,
        is_active: true,
      }

      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(mockDocument),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      await expect(
        service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')
      ).rejects.toThrow('Document is already signed')
    })

    it('should throw error when re-authentication fails', async () => {
      const service = new DocumentService('test-token')
      const mockDocument: Document = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'original_hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Auth failed') 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(mockDocument),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      await expect(
        service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')
      ).rejects.toThrow('Authentication failed')
    })

    it('should rollback GCS upload when DB insert fails', async () => {
      const service = new DocumentService('test-token')
      const mockDocument: Document = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'original_hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(mockDocument),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      const mockAdminRepoInstance = {
        insertSignature: jest.fn().mockRejectedValue(new Error('DB Insert Failed')),
        updateDocumentAsSigned: jest.fn().mockResolvedValue(undefined),
      } as any
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance)

      mockGCSUtil.downloadPdf.mockResolvedValue(Buffer.from('original pdf'))
      mockHashUtil.sha256.mockReturnValue('original_hash')
      mockPDFUtil.appendSignatureBlock.mockResolvedValue(Buffer.from('signed pdf'))
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)
      mockGCSUtil.deletePdf.mockResolvedValue(undefined)

      await expect(
        service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')
      ).rejects.toThrow('DB Insert Failed')

      expect(mockGCSUtil.uploadPdf).toHaveBeenCalled()
      expect(mockGCSUtil.deletePdf).toHaveBeenCalled()
    })

    it('should rollback GCS upload when document update fails', async () => {
      const service = new DocumentService('test-token')
      const mockDocument: Document = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'original_hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      const signRequest: SignDocumentRequest = {
        password: 'password123',
        fullName: 'John Doe',
        identificationNumber: '123456789',
      }

      const mockSignInWithPassword = jest.fn().mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      })
      
      mockCreateSupabaseAdminClient.mockReturnValue({ 
        auth: { signInWithPassword: mockSignInWithPassword } 
      } as any)

      const mockUserRepoInstance = {
        getDocumentById: jest.fn().mockResolvedValue(mockDocument),
      } as any
      mockDocumentUserRepository.mockImplementation(() => mockUserRepoInstance)

      const mockAdminRepoInstance = {
        insertSignature: jest.fn().mockResolvedValue(undefined),
        updateDocumentAsSigned: jest.fn().mockRejectedValue(new Error('DB Update Failed')),
      } as any
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance)

      mockGCSUtil.downloadPdf.mockResolvedValue(Buffer.from('original pdf'))
      mockHashUtil.sha256.mockReturnValue('original_hash')
      mockPDFUtil.appendSignatureBlock.mockResolvedValue(Buffer.from('signed pdf'))
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)
      mockGCSUtil.deletePdf.mockResolvedValue(undefined)

      await expect(
        service.signDocument('doc-123', 'user-123', signRequest, '192.168.1.1', 'Test Agent', 'test@example.com')
      ).rejects.toThrow('DB Update Failed')

      expect(mockGCSUtil.uploadPdf).toHaveBeenCalled()
      expect(mockGCSUtil.deletePdf).toHaveBeenCalled()
    })
  })

  describe('uploadDocument (Static Method)', () => {
    it('should upload new document successfully', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue({ employee_id: 456 }),
        checkIdempotency: jest.fn().mockResolvedValue(null),
        insertDocument: jest.fn().mockResolvedValue({
          id: 'generated-doc-id',
          user_id: 'user-123',
          employee_id: 456,
          payroll_period_start: '2025-01-01', // PostgreSQL YYYY-MM-DD format (returned by repo)
          payroll_period_end: '2025-01-31', // PostgreSQL YYYY-MM-DD format (returned by repo)
          pdf_original_path: 'original/user-123/generated-doc-id.pdf',
          status: 'PENDING',
          original_hash: 'computed-hash',
          pdf_signed_path: null,
          signed_hash: null,
          created_at: '2025-01-01T00:00:00Z',
          signed_at: null,
          superseded_by: null,
          is_active: true,
        }),
        supersedeOldDocuments: jest.fn().mockResolvedValue(undefined),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)
      mockUuidV4.mockReturnValue('generated-doc-id')
      mockHashUtil.sha256.mockReturnValue('computed-hash')
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025', // DD-MM-YYYY input format
        payroll_period_end: '31-01-2025', // DD-MM-YYYY input format
      }

      const result = await DocumentService.uploadDocument(request)

      expect(mockAdminRepoInstance.checkUserExists).toHaveBeenCalledWith('user-123')
      expect(mockHashUtil.sha256).toHaveBeenCalledWith(Buffer.from('test pdf'))
      // Dates are converted to PostgreSQL format (MM-DD-YYYY) for storage
      expect(mockAdminRepoInstance.checkIdempotency).toHaveBeenCalledWith('user-123', '01-01-2025', '01-31-2025', 'computed-hash')
      expect(mockUuidV4).toHaveBeenCalled()
      expect(mockGCSUtil.uploadPdf).toHaveBeenCalledWith('original/user-123/generated-doc-id.pdf', Buffer.from('test pdf'))
      expect(mockAdminRepoInstance.insertDocument).toHaveBeenCalled()
      expect(result).toEqual({
        document_id: 'generated-doc-id',
        status: 'PENDING',
        payroll_period_start: '01-01-2025', // Returned in DD-MM-YYYY format
        payroll_period_end: '31-01-2025', // Returned in DD-MM-YYYY format
      })
    })

    it('should call supersedeOldDocuments when uploading new document', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue({ employee_id: 456 }),
        checkIdempotency: jest.fn().mockResolvedValue(null),
        insertDocument: jest.fn().mockResolvedValue({
          id: 'generated-doc-id',
          user_id: 'user-123',
          employee_id: 456,
          payroll_period_start: '2025-01-01', // PostgreSQL YYYY-MM-DD format
          payroll_period_end: '2025-01-31', // PostgreSQL YYYY-MM-DD format
          pdf_original_path: 'original/user-123/generated-doc-id.pdf',
          status: 'PENDING',
          original_hash: 'computed-hash',
          pdf_signed_path: null,
          signed_hash: null,
          created_at: '2025-01-01T00:00:00Z',
          signed_at: null,
          superseded_by: null,
          is_active: true,
        }),
        supersedeOldDocuments: jest.fn().mockResolvedValue(undefined),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)
      mockUuidV4.mockReturnValue('generated-doc-id')
      mockHashUtil.sha256.mockReturnValue('computed-hash')
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      await DocumentService.uploadDocument(request)

      expect(mockAdminRepoInstance.supersedeOldDocuments).toHaveBeenCalledWith(
        'user-123',
        '01-01-2025',
        '01-31-2025',
        'generated-doc-id'
      )
    })

    it('should return existing document for idempotent request', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue({ employee_id: 456 }),
        checkIdempotency: jest.fn().mockResolvedValue({
          id: 'existing-doc-id',
          user_id: 'user-123',
          employee_id: 456,
          payroll_period_start: '2025-01-01', // PostgreSQL YYYY-MM-DD format
          payroll_period_end: '2025-01-31', // PostgreSQL YYYY-MM-DD format
          pdf_original_path: 'original/user-123/existing-doc-id.pdf',
          status: 'PENDING',
          original_hash: 'computed-hash',
          pdf_signed_path: null,
          signed_hash: null,
          created_at: '2025-01-01T00:00:00Z',
          signed_at: null,
          superseded_by: null,
          is_active: true,
        }),
        insertDocument: jest.fn(),
        supersedeOldDocuments: jest.fn(),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)
      mockHashUtil.sha256.mockReturnValue('computed-hash')

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      const result = await DocumentService.uploadDocument(request)

      expect(mockGCSUtil.uploadPdf).not.toHaveBeenCalled()
      expect(mockAdminRepoInstance.insertDocument).not.toHaveBeenCalled()
      expect(result).toEqual({
        document_id: 'existing-doc-id',
        status: 'PENDING',
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
        idempotent: true,
      })
    })

    it('should throw error when user does not exist', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue(null),
        checkIdempotency: jest.fn(),
        insertDocument: jest.fn(),
        supersedeOldDocuments: jest.fn(),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('User not found')
    })

    it('should throw error when employee ID does not match', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue({ employee_id: 789 }),
        checkIdempotency: jest.fn(),
        insertDocument: jest.fn(),
        supersedeOldDocuments: jest.fn(),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('Employee ID does not match user profile')
    })

    it('should rollback GCS upload on database error', async () => {
      const mockAdminRepoInstance = {
        checkUserExists: jest.fn().mockResolvedValue({ employee_id: 456 }),
        checkIdempotency: jest.fn().mockResolvedValue(null),
        insertDocument: jest.fn().mockRejectedValue(new Error('DB Error')),
        supersedeOldDocuments: jest.fn().mockResolvedValue(undefined),
      }
      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance as any)
      mockUuidV4.mockReturnValue('generated-doc-id')
      mockHashUtil.sha256.mockReturnValue('computed-hash')
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)
      mockGCSUtil.deletePdf.mockResolvedValue(undefined)

      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period_start: '01-01-2025',
        payroll_period_end: '31-01-2025',
      }

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('DB Error')

      expect(mockGCSUtil.uploadPdf).toHaveBeenCalled()
      expect(mockGCSUtil.deletePdf).toHaveBeenCalledWith('original/user-123/generated-doc-id.pdf')
    })
  })
})
