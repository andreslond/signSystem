import { DocumentUserRepository } from '../../src/repositories/DocumentUserRepository'
import { Document, SupabaseResult } from '../../src/types'

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
}

const { createSupabaseUserClient } = require('../../src/config/supabase')
createSupabaseUserClient.mockReturnValue(mockSupabaseClient)

describe('DocumentUserRepository', () => {
  let repository: DocumentUserRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new DocumentUserRepository('test-token')
  })

  describe('listDocumentsByUser', () => {
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

      const result = await repository.listDocumentsByUser('user-123')

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

      const result = await repository.listDocumentsByUser('user-123')

      expect(result).toEqual([])
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.order.mockResolvedValue({ data: null, error })

      await expect(repository.listDocumentsByUser('user-123')).rejects.toThrow('Database error')
    })
  })

  describe('getDocumentById', () => {
    it('should return document when found and owned by user', async () => {
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

    it('should throw error on database error other than not found', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.getDocumentById('doc-123', 'user-123')).rejects.toThrow('Database error')
    })
  })

  describe('validateDocumentOwnership', () => {
    it('should return document when ownership is valid', async () => {
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

      const result = await repository.validateDocumentOwnership('doc-123', 'user-123')

      expect(result).toEqual(mockDocument)
    })

    it('should return null when document is not owned by user (RLS denies access)', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await repository.validateDocumentOwnership('doc-123', 'user-456')

      expect(result).toBeNull()
    })
  })
})
