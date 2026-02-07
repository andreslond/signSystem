import { DocumentRepository } from '../../src/repositories/DocumentRepository'
import { Document, SignatureData, SupabaseQueryBuilderMock, SupabaseClientMock, SupabaseResult } from '../../src/types'

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  createSupabaseUserClient: jest.fn(),
}))

const getDocumentsBuilder = {
  order: jest.fn<Promise<SupabaseResult<Document[]>>, [string, any]>(),
}

const getDocumentByIdBuilder = {
  single: jest.fn<Promise<SupabaseResult<Document>>, []>(),
}

const insertBuilder = jest.fn<Promise<{ error: any | null }>, [SignatureData]>()

const updateBuilder = {
  eq: jest.fn<Promise<{ error: any | null }>, [string, string]>(),
}

const mockSupabaseClient = {
  schema: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),

  order: jest.fn().mockImplementation(
  (column: string, options?: { ascending?: boolean }) =>
    getDocumentsBuilder.order(column, options)
  ),

  single: jest.fn().mockImplementation(
    () => getDocumentByIdBuilder.single()
  ),

  insert: jest.fn().mockImplementation(
    (data) => insertBuilder(data)
  ),

  update: jest.fn().mockReturnValue(updateBuilder),
}

const { createSupabaseUserClient } = require('../../src/config/supabase')
createSupabaseUserClient.mockReturnValue(mockSupabaseClient)

describe('DocumentRepository', () => {
  let repository: DocumentRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new DocumentRepository('test-token')
  })

  describe('getDocumentsByUser', () => {
    it('should return user documents ordered by creation date', async () => {
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
      mockSupabaseClient.order.mockResolvedValue({ data: mockDocuments, error: null })
      
      const result = await repository.getDocumentsByUser('user-123')

      expect(createSupabaseUserClient).toHaveBeenCalledWith('test-token')
      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockDocuments)
    })

    it('should return empty array when no documents found', async () => {
      mockSupabaseClient.order.mockResolvedValue({ data: [], error: null })

      const result = await repository.getDocumentsByUser('user-123')

      expect(result).toEqual([])
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
       mockSupabaseClient.order.mockResolvedValue({ data: null, error })

      await expect(repository.getDocumentsByUser('user-123')).rejects.toThrow('Database error')
    })
  })

  describe('getDocumentById', () => {
    it('should return document when found', async () => {
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
      mockSupabaseClient.single.mockResolvedValue({ data: mockDocument, error: null })

      const result = await repository.getDocumentById('doc-123', 'user-123')

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'doc-123')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result).toEqual(mockDocument)
    })

    it('should return null when document not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await repository.getDocumentById('doc-123', 'user-123')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.getDocumentById('doc-123', 'user-123')).rejects.toThrow('Database error')
    })
  })

  describe('insertSignature', () => {
    it('should insert signature successfully', async () => {
      const signatureData: SignatureData = {
        document_id: 'doc-123',
        name: 'John Doe',
        identification_number: '123456789',
        ip: '192.168.1.1',
        user_agent: 'Test Agent',
        hash_sign: 'signature_hash',
        signed_at: '2025-01-01T00:00:00Z',
      }

      mockSupabaseClient.insert.mockResolvedValue({ error: null })

      await expect(repository.insertSignature(signatureData)).resolves.toBeUndefined()

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('signatures')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(signatureData)
    })

    it('should throw error on insert failure', async () => {
      const signatureData: SignatureData = {
        document_id: 'doc-123',
        name: 'John Doe',
        identification_number: '123456789',
        ip: '192.168.1.1',
        user_agent: 'Test Agent',
        hash_sign: 'signature_hash',
        signed_at: '2025-01-01T00:00:00Z',
      }

      const error = new Error('Insert failed')
      mockSupabaseClient.insert.mockResolvedValue({ error })

      await expect(repository.insertSignature(signatureData)).rejects.toThrow('Insert failed')
    })
  })

  describe('updateDocumentAsSigned', () => {
    it('should update document as signed', async () => {
      updateBuilder.eq.mockResolvedValue({ error: null })
      mockSupabaseClient.update.mockReturnValue(updateBuilder)

      await expect(repository.updateDocumentAsSigned('doc-123', 'signed_hash', '2025-01-01T00:00:00Z')).resolves.toBeUndefined()

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        status: 'SIGNED',
        signed_hash: 'signed_hash',
        signed_at: '2025-01-01T00:00:00Z',
      })
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'doc-123')
    })

    it('should throw error on update failure', async () => {
      const error = new Error('Update failed')
      updateBuilder.eq.mockResolvedValue({ error })
      mockSupabaseClient.update.mockReturnValue(updateBuilder)

      await expect(repository.updateDocumentAsSigned('doc-123', 'signed_hash', '2025-01-01T00:00:00Z')).rejects.toThrow('Update failed')
    })
  })
})