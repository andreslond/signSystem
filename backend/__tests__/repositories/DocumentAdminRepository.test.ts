import { DocumentAdminRepository } from '../../src/repositories/DocumentAdminRepository'
import { Document } from '../../src/types'

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  createSupabaseAdminClient: jest.fn(),
}))

const mockSupabaseClient: any = {
  schema: jest.fn(() => mockSupabaseClient),
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
  insert: jest.fn(() => mockSupabaseClient),
}

const { createSupabaseAdminClient } = require('../../src/config/supabase')
createSupabaseAdminClient.mockReturnValue(mockSupabaseClient)

describe('DocumentAdminRepository', () => {
  let repository: DocumentAdminRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new DocumentAdminRepository()
  })

  describe('checkUserExists', () => {
    it('should return user profile when user exists', async () => {
      const mockProfile = { employee_id: 123 }
      mockSupabaseClient.single.mockResolvedValue({ data: mockProfile, error: null })

      const result = await repository.checkUserExists('user-123')

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('employee_id')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123')
      expect(result).toEqual(mockProfile)
    })

    it('should return null when user does not exist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await repository.checkUserExists('non-existent-user')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.checkUserExists('user-123')).rejects.toThrow('Database error')
    })
  })

  describe('checkIdempotency', () => {
    it('should return existing document when found', async () => {
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
      mockSupabaseClient.single.mockResolvedValue({ data: mockDocument, error: null })

      const result = await repository.checkIdempotency('user-123', '2025-01', 'hash123')

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('payroll_period', '2025-01')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('original_hash', 'hash123')
      expect(result).toEqual(mockDocument)
    })

    it('should return null when no document found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await repository.checkIdempotency('user-123', '2025-01', 'hash123')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      const error = new Error('Database error')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.checkIdempotency('user-123', '2025-01', 'hash123')).rejects.toThrow('Database error')
    })
  })

  describe('insertDocument', () => {
    it('should insert document and return it', async () => {
      const documentData = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        status: 'PENDING' as const,
        original_hash: 'hash123',
        superseded_by: null,
        is_active: true,
      }

      const mockInsertedDocument: Document = {
        ...documentData,
        pdf_signed_path: null,
        signed_hash: null,
        signed_at: null,
        created_at: '2025-01-01T00:00:00Z',
      }

      mockSupabaseClient.single.mockResolvedValue({ data: mockInsertedDocument, error: null })

      const result = await repository.insertDocument(documentData)

      expect(mockSupabaseClient.schema).toHaveBeenCalledWith('ar_signatures')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(documentData)
      expect(result).toEqual(mockInsertedDocument)
    })

    it('should throw error on insert failure', async () => {
      const documentData = {
        id: 'doc-123',
        user_id: 'user-123',
        employee_id: 456,
        payroll_period: '2025-01',
        pdf_original_path: 'original/user-123/doc-123.pdf',
        status: 'PENDING' as const,
        original_hash: 'hash123',
        superseded_by: null,
        is_active: true,
      }

      const error = new Error('Insert failed')
      mockSupabaseClient.single.mockRejectedValue(error)

      await expect(repository.insertDocument(documentData)).rejects.toThrow('Insert failed')
    })
  })
})