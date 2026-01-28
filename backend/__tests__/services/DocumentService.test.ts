import { DocumentService } from '../../src/services/DocumentService'
import { DocumentRepository } from '../../src/repositories/DocumentRepository'
import { DocumentAdminRepository } from '../../src/repositories/DocumentAdminRepository'
import { GCSUtil } from '../../src/utils/gcs'
import { PDFUtil } from '../../src/utils/pdf'
import { HashUtil } from '../../src/utils/hash'
import { Document, SignDocumentRequest, UploadDocumentRequest, UploadDocumentResponse } from '../../src/types'

// Mock dependencies
jest.mock('../../src/repositories/DocumentRepository')
jest.mock('../../src/repositories/DocumentAdminRepository')
jest.mock('../../src/utils/gcs')
jest.mock('../../src/utils/pdf')
jest.mock('../../src/utils/hash')
jest.mock('uuid', () => ({ v4: jest.fn() }))

const mockDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>
const mockDocumentAdminRepository = DocumentAdminRepository as jest.MockedClass<typeof DocumentAdminRepository>
const mockGCSUtil = GCSUtil as jest.Mocked<typeof GCSUtil>
const mockPDFUtil = PDFUtil as jest.Mocked<typeof PDFUtil>
const mockHashUtil = HashUtil as jest.Mocked<typeof HashUtil>
const { v4: mockUuidV4 } = require('uuid')

describe('DocumentService', () => {
  let service: DocumentService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DocumentService('test-token')
  })

  describe('User Methods', () => {
    describe('listUserDocuments', () => {
      it('should return user documents', async () => {
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

        const mockRepoInstance = {
          getDocumentsByUser: jest.fn().mockResolvedValue(mockDocuments),
        } as any

        mockDocumentRepository.mockImplementation(() => mockRepoInstance)

        const result = await service.listUserDocuments('user-123')

        expect(mockRepoInstance.getDocumentsByUser).toHaveBeenCalledWith('user-123')
        expect(result).toEqual(mockDocuments)
      })
    })

    describe('getUserDocument', () => {
      it('should return user document', async () => {
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

        const mockRepoInstance = {
          getDocumentById: jest.fn().mockResolvedValue(mockDocument),
        } as any

        mockDocumentRepository.mockImplementation(() => mockRepoInstance)

        const result = await service.getUserDocument('doc-123', 'user-123')

        expect(mockRepoInstance.getDocumentById).toHaveBeenCalledWith('doc-123', 'user-123')
        expect(result).toEqual(mockDocument)
      })
    })
  })

  describe('uploadDocument (Static Method)', () => {
    let mockAdminRepoInstance: any

    beforeEach(() => {
      mockAdminRepoInstance = {
        checkUserExists: jest.fn(),
        checkIdempotency: jest.fn(),
        insertDocument: jest.fn(),
      }

      mockDocumentAdminRepository.mockImplementation(() => mockAdminRepoInstance)
      mockUuidV4.mockReturnValue('generated-doc-id')
      mockHashUtil.sha256.mockReturnValue('computed-hash')
    })

    it('should upload new document successfully', async () => {
      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
      }

      const mockProfile = { employee_id: 456 }
      const mockInsertedDoc: Document = {
        id: 'generated-doc-id',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
        pdf_original_path: 'original/user-123/generated-doc-id.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'computed-hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      mockAdminRepoInstance.checkUserExists.mockResolvedValue(mockProfile)
      mockAdminRepoInstance.checkIdempotency.mockResolvedValue(null)
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)
      mockAdminRepoInstance.insertDocument.mockResolvedValue(mockInsertedDoc)

      const result = await DocumentService.uploadDocument(request)

      expect(mockAdminRepoInstance.checkUserExists).toHaveBeenCalledWith('user-123')
      expect(mockHashUtil.sha256).toHaveBeenCalledWith(Buffer.from('test pdf'))
      expect(mockAdminRepoInstance.checkIdempotency).toHaveBeenCalledWith('user-123', '2025-01', 'computed-hash')
      expect(mockUuidV4).toHaveBeenCalled()
      expect(mockGCSUtil.uploadPdf).toHaveBeenCalledWith('original/user-123/generated-doc-id.pdf', Buffer.from('test pdf'))
      expect(mockAdminRepoInstance.insertDocument).toHaveBeenCalled()
      expect(result).toEqual({
        document_id: 'generated-doc-id',
        status: 'PENDING',
        payroll_period: '2025-01',
      })
    })

    it('should return existing document for idempotent request', async () => {
      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
      }

      const existingDoc: Document = {
        id: 'existing-doc-id',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
        pdf_original_path: 'original/user-123/existing-doc-id.pdf',
        pdf_signed_path: null,
        status: 'PENDING',
        original_hash: 'computed-hash',
        signed_hash: null,
        created_at: '2025-01-01T00:00:00Z',
        signed_at: null,
        superseded_by: null,
        is_active: true,
      }

      mockAdminRepoInstance.checkUserExists.mockResolvedValue({ employee_id: 456 })
      mockAdminRepoInstance.checkIdempotency.mockResolvedValue(existingDoc)

      const result = await DocumentService.uploadDocument(request)

      expect(mockGCSUtil.uploadPdf).not.toHaveBeenCalled()
      expect(mockAdminRepoInstance.insertDocument).not.toHaveBeenCalled()
      expect(result).toEqual({
        document_id: 'existing-doc-id',
        status: 'PENDING',
        payroll_period: '2025-01',
        idempotent: true,
      })
    })

    it('should throw error when user does not exist', async () => {
      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
      }

      mockAdminRepoInstance.checkUserExists.mockResolvedValue(null)

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('User not found')
    })

    it('should throw error when employee ID does not match', async () => {
      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
      }

      mockAdminRepoInstance.checkUserExists.mockResolvedValue({ employee_id: 789 })

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('Employee ID does not match user profile')
    })

    it('should rollback GCS upload on database error', async () => {
      const request: UploadDocumentRequest = {
        pdf: Buffer.from('test pdf'),
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
      }

      mockAdminRepoInstance.checkUserExists.mockResolvedValue({ employee_id: 456 })
      mockAdminRepoInstance.checkIdempotency.mockResolvedValue(null)
      mockGCSUtil.uploadPdf.mockResolvedValue(undefined)
      mockAdminRepoInstance.insertDocument.mockRejectedValue(new Error('DB Error'))
      mockGCSUtil.deletePdf.mockResolvedValue(undefined)

      await expect(DocumentService.uploadDocument(request)).rejects.toThrow('DB Error')

      expect(mockGCSUtil.uploadPdf).toHaveBeenCalled()
      expect(mockGCSUtil.deletePdf).toHaveBeenCalledWith('original/user-123/generated-doc-id.pdf')
    })
  })
})