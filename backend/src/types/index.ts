// =========================================
// Document Types
// =========================================

/**
 * Document entity from ar_signatures.documents table
 */
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

/**
 * Allowed document statuses for filtering
 */
export const ALLOWED_DOCUMENT_STATUSES = ['PENDING', 'SIGNED', 'INVALIDATED'] as const
export type DocumentStatus = typeof ALLOWED_DOCUMENT_STATUSES[number]

/**
 * Document fields for insertion (without auto-generated fields)
 */
export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'signed_at' | 'pdf_signed_path' | 'signed_hash'>

// =========================================
// Signature Types
// =========================================

/**
 * Signature entity from ar_signatures.signatures table
 */
export interface Signature {
  id: string
  document_id: string
  name: string
  identification_number: string
  identification_type?: string
  ip: string
  user_agent: string
  hash_sign: string
  signed_at: string
}

/**
 * Signature data for insertion
 */
export interface SignatureData {
  document_id: string
  name: string
  identification_number: string
  identification_type?: string
  ip: string
  user_agent: string
  hash_sign: string
  signed_at: string
}

// =========================================
// Employee Types
// =========================================

/**
 * Employee entity from ar_nomina.employees table
 */
export interface Employee {
  id: number
  name: string
  email: string | null
  identification_number: string | null
  identification_type: string | null
  active: boolean
  company_id: number | null
  external_employee_id: string | null
  external_provider_id: string | null
  created_at: string | null
}

/**
 * Employee fields returned from repository queries
 */
export interface EmployeeSelectResult {
  id: number
  name: string
  email: string | null
  identification_number: string | null
  identification_type: string | null
  company_id: number | null
  external_employee_id: string | null
  external_provider_id: string | null
  active: boolean
}

/**
 * Document statistics for an employee
 */
export interface EmployeeDocumentStats {
  pendingCount: number
  signedCount: number
}

/**
 * Summary of last documents for an employee (used in list view)
 */
export interface EmployeeDocumentSummary {
  id: string
  title: string | null
  subtitle: string | null
  payroll_period_start: string
  payroll_period_end: string
  status: DocumentStatus
  signed_at: string | null
  amount: number | null
}

/**
 * Enriched employee with document statistics (for list view)
 */
export interface EmployeeWithStats extends Employee {
  stats: EmployeeDocumentStats
  lastDocuments: {
    pending: EmployeeDocumentSummary[]
    signed: EmployeeDocumentSummary[]
  }
}

/**
 * Enriched employee with full document lists (for detail view)
 */
export interface EmployeeWithDocuments extends Employee {
  stats: EmployeeDocumentStats
  documents: {
    pending: EmployeeDocumentSummary[]
    signed: EmployeeDocumentSummary[]
  }
}

/**
 * Fields that can be updated on an employee
 */
export type EmployeeUpdateFields = Partial<Pick<Employee, 
  | 'email'
  | 'identification_number'
  | 'identification_type'
  | 'external_employee_id'
  | 'external_provider_id'
  | 'active'
>>

/**
 * Request body for updating an employee
 */
export interface UpdateEmployeeRequest extends EmployeeUpdateFields {}

// =========================================
// Profile Types
// =========================================

/**
 * User profile from ar_signatures.profiles table
 */
export interface Profile {
  id: string
  employee_id: number | null
  created_at?: string
}

/**
 * Profile result for user existence check
 */
export interface ProfileEmployeeResult {
  employee_id: number
}

// =========================================
// API Request/Response Types
// =========================================

/**
 * Generic API response wrapper
 */
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

/**
 * Sign document request body
 */
export interface SignDocumentRequest {
  password: string
  fullName: string
  identificationNumber: string
}

/**
 * Upload document request
 */
export interface UploadDocumentRequest {
  pdf: Buffer
  user_id: string
  employee_id: number
  payroll_period_start: string
  payroll_period_end: string
  amount?: string
}

/**
 * Upload document response
 */
export interface UploadDocumentResponse {
  document_id: string
  status: 'PENDING'
  payroll_period_start: string
  payroll_period_end: string
  idempotent?: boolean
}

/**
 * Response for PDF URL endpoint
 */
export interface PdfUrlResponse {
  documentId: string
  url: string
  expiresAt: string
  pdfType: 'original' | 'signed'
}

// =========================================
// Pagination Types
// =========================================

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
 * Response for paginated employee list
 */
export interface PaginatedEmployeesResponse {
  data: EmployeeWithStats[]
  pagination: PaginationMeta
}

// =========================================
// Repository Result Types
// =========================================

/**
 * Result type for employee list queries
 */
export interface EmployeeListResult {
  data: EmployeeSelectResult[]
  count: number
}

/**
 * Result type for document stats queries
 */
export interface DocumentStatsResult {
  pendingCount: number
  signedCount: number
}

// =========================================
// Test Mock Types
// =========================================

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
