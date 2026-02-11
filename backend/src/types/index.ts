export interface Document {
  id: string
  user_id: string
  employee_id: number
  payroll_period_start: string
  payroll_period_end: string
  pdf_original_path: string
  pdf_signed_path: string | null
  status: 'PENDING' | 'SIGNED' | 'INVALIDATED'
  original_hash: string
  signed_hash: string | null
  created_at: string
  signed_at: string | null
  superseded_by: string | null
  is_active: boolean
  amount?: number
  // Employee data (joined from ar_nomina.employees)
  employee_name?: string
  employee_email?: string
  employee_identification_number?: string
  employee_identification_type?: string
  // Signature data (from ar_signatures.signatures for signed documents)
  signer_name?: string
  signer_identification?: string
  signer_identification_type?: string
}

export interface Signature {
  id: string
  document_id: string
  name: string
  identification_number: string
  ip: string
  user_agent: string
  hash_sign: string
  signed_at: string
}

export interface SignDocumentRequest {
  password: string
  fullName: string
  identificationNumber: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface SignatureData {
  document_id: string
  name: string
  identification_number: string
  ip: string
  user_agent: string
  hash_sign: string
  signed_at: string
}

export interface UploadDocumentRequest {
  pdf: Buffer
  user_id: string
  employee_id: number
  payroll_period_start: string
  payroll_period_end: string
}

export interface UploadDocumentResponse {
  document_id: string
  status: 'PENDING'
  payroll_period_start: string
  payroll_period_end: string
  idempotent?: boolean
}

/**
 * Pagination metadata returned by list endpoints
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  /** Whether there are more pages after current */
  hasNextPage: boolean
  /** Whether there are pages before current */
  hasPrevPage: boolean
}

/**
 * Create pagination metadata from raw values
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

/**
 * Paginated document response
 */
export interface PaginatedDocumentsResponse {
  data: Document[]
  pagination: PaginationMeta
}

/**
 * Allowed document statuses for filtering
 */
export const ALLOWED_DOCUMENT_STATUSES = ['PENDING', 'SIGNED', 'INVALIDATED'] as const
export type DocumentStatus = typeof ALLOWED_DOCUMENT_STATUSES[number]

export type SupabaseResult<T = any> = {
  data: T | null
  error: Error | null
}

export type SupabaseQueryBuilderMock<T = any> = {
  eq: jest.Mock<Promise<SupabaseResult<T>>, [string, any]>
  single?: jest.Mock<Promise<SupabaseResult<T>>, []>
}

export type SupabaseClientMock = {
  schema: jest.Mock<SupabaseClientMock, [string]>
  from: jest.Mock<SupabaseClientMock, [string]>
  select: jest.Mock<SupabaseClientMock, [string?]>
  order: jest.Mock<SupabaseClientMock, [string, { ascending?: boolean }?]>
  insert: jest.Mock<SupabaseQueryBuilderMock, [any]>
  update: jest.Mock<SupabaseQueryBuilderMock, [any]>
  eq: jest.Mock<SupabaseClientMock, [string, any]>
}

export type MockQueryBuilder<T = any> = {
  select: jest.MockedFunction<any>
  eq: jest.MockedFunction<any>
  single: jest.MockedFunction<() => Promise<SupabaseResult<T>>>
  insert: jest.MockedFunction<() => Promise<SupabaseResult<T>>>
  update: jest.MockedFunction<any>
}
