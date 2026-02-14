import { Response } from 'express'

/**
 * API Error Codes for consistent error responses
 */
export const API_ERROR_CODES = {
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

/**
 * Standard API Error Response format
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, any>
    path?: string
    timestamp: string
  }
}

/**
 * Standard API Success Response format
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  meta?: {
    timestamp: string
    requestId?: string
    [key: string]: any
  }
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly path?: string

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, any>,
    path?: string
  ) {
    super(message)
    this.code = code
    this.message = message
    this.statusCode = statusCode
    this.details = details
    this.path = path
    this.name = 'ApiError'
  }

  /**
   * Create a validation error (400)
   */
  static validation(message: string, details?: Record<string, any>, path?: string): ApiError {
    return new ApiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400, details, path)
  }

  /**
   * Create an unauthorized error (401)
   */
  static unauthorized(message: string = 'Authentication required'): ApiError {
    return new ApiError(API_ERROR_CODES.UNAUTHORIZED, message, 401)
  }

  /**
   * Create a forbidden error (403)
   */
  static forbidden(message: string = 'Access denied'): ApiError {
    return new ApiError(API_ERROR_CODES.FORBIDDEN, message, 403)
  }

  /**
   * Create a not found error (404)
   */
  static notFound(resource: string, id?: string): ApiError {
    const message = id ? `${resource} not found with id: ${id}` : `${resource} not found`
    return new ApiError(API_ERROR_CODES.NOT_FOUND, message, 404)
  }

  /**
   * Create a conflict error (409)
   */
  static conflict(message: string): ApiError {
    return new ApiError(API_ERROR_CODES.CONFLICT, message, 409)
  }

  /**
   * Create an internal server error (500)
   */
  static internal(message: string = 'An unexpected error occurred'): ApiError {
    return new ApiError(API_ERROR_CODES.INTERNAL_ERROR, message, 500)
  }

  /**
   * Create a database error (500)
   */
  static database(message: string, details?: Record<string, any>): ApiError {
    return new ApiError(API_ERROR_CODES.DATABASE_ERROR, message, 500, details)
  }

  /**
   * Convert to JSON response format
   */
  toJson(): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        path: this.path,
        timestamp: new Date().toISOString(),
      },
    }
  }

  /**
   * Send error response to client
   */
  send(res: Response): Response {
    return res.status(this.statusCode).json(this.toJson())
  }
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: { requestId?: string; pagination?: Record<string, any>; [key: string]: any }
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }
  return res.json(response)
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: { requestId?: string; [key: string]: any }
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }
  return res.status(201).json(response)
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send()
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: any,
  req: any,
  res: Response,
  next: any
): void {
  // Handle ApiError
  if (err instanceof ApiError) {
    err.send(res)
    return
  }

  // Handle validation errors from express-validator or similar
  if (err.type === 'validation.error' || err.name === 'ValidationError') {
    ApiError.validation(err.message, err.details, req.path).send(res)
    return
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    ApiError.database('Database query error', { code: err.code }).send(res)
    return
  }

  // Log unexpected errors
  console.error('[Unhandled Error]', err)

  // Default to 500 internal server error
  ApiError.internal('An unexpected error occurred').send(res)
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
