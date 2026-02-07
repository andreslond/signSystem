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
  error?: string
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
}
