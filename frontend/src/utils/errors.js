/**
 * Custom Error Classes following error-handling-patterns skill.
 * Provides structured error handling with codes, status codes, and metadata.
 * Supports both application errors and API errors from backend.
 */

/**
 * Backend API Error codes (matching backend/src/utils/apiError.ts)
 */
export const ApiErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};

/**
 * Base application error class with structured error information.
 */
export class ApplicationError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validation error - raised when input validation fails.
 */
export class ValidationError extends ApplicationError {
  constructor(message, details = null) {
    super(message, ApiErrorCodes.VALIDATION_ERROR, 400, details);
  }
}

/**
 * Unauthorized error - raised when authentication fails or is missing.
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Authentication required', details = null) {
    super(message, ApiErrorCodes.UNAUTHORIZED, 401, details);
  }
}

/**
 * Forbidden error - raised when user lacks permission.
 */
export class ForbiddenError extends ApplicationError {
  constructor(message = 'Access denied', details = null) {
    super(message, ApiErrorCodes.FORBIDDEN, 403, details);
  }
}

/**
 * Not found error - raised when a resource is not found.
 */
export class NotFoundError extends ApplicationError {
  constructor(resource, id = null) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, ApiErrorCodes.NOT_FOUND, 404, { resource, id });
  }
}

/**
 * Conflict error - raised when there's a conflict (e.g., duplicate resource).
 */
export class ConflictError extends ApplicationError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, ApiErrorCodes.CONFLICT, 409, details);
  }
}

/**
 * Authentication error - raised when authentication fails.
 */
export class AuthError extends ApplicationError {
  constructor(message, details = null) {
    super(message, 'AUTH_ERROR', 401, details);
  }
}

/**
 * Network error - raised when network request fails.
 */
export class NetworkError extends ApplicationError {
  constructor(message = 'Network request failed', details = null) {
    super(message, 'NETWORK_ERROR', 0, details);
  }
}

/**
 * Rate limit error - raised when API rate limit is exceeded.
 */
export class RateLimitError extends ApplicationError {
  constructor(message = 'Rate limit exceeded', details = null) {
    super(message, ApiErrorCodes.RATE_LIMITED, 429, details);
  }
}

/**
 * Server error - raised when the server encounters an unexpected condition.
 */
export class ServerError extends ApplicationError {
  constructor(message = 'Internal server error', details = null) {
    super(message, ApiErrorCodes.INTERNAL_ERROR, 500, details);
  }
}

/**
 * Database error - raised when a database operation fails.
 */
export class DatabaseError extends ApplicationError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, ApiErrorCodes.DATABASE_ERROR, 500, details);
  }
}

/**
 * External service error - raised when an external service call fails.
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message = 'External service error', details = null) {
    super(message, ApiErrorCodes.EXTERNAL_SERVICE_ERROR, 502, details);
  }
}

/**
 * Supabase-specific error wrapper.
 */
export class SupabaseError extends ApplicationError {
  constructor(error) {
    const message = error.message || 'Unknown Supabase error';
    let code = 'SUPABASE_ERROR';
    let statusCode = 500;

    // Map Supabase error codes to our codes
    if (message.includes('Invalid login credentials')) {
      code = 'INVALID_CREDENTIALS';
      statusCode = 401;
    } else if (message.includes('Email not confirmed')) {
      code = 'EMAIL_NOT_CONFIRMED';
      statusCode = 401;
    } else if (message.includes('User not found')) {
      code = 'USER_NOT_FOUND';
      statusCode = 404;
    } else if (message.includes('rate limit') || message.includes('Rate limit')) {
      code = ApiErrorCodes.RATE_LIMITED;
      statusCode = 429;
    } else if (message.includes('network') || message.includes('fetch')) {
      code = 'NETWORK_ERROR';
      statusCode = 0;
    }

    super(message, code, statusCode, { originalError: error });
  }
}

/**
 * Error factory function to create appropriate error type from unknown error.
 */
export function createErrorFromUnknown(error) {
  if (error instanceof ApplicationError) {
    return error;
  }

  // Handle API errors with structured codes
  if (error.code && error.statusCode) {
    switch (error.code) {
      case ApiErrorCodes.VALIDATION_ERROR:
        return new ValidationError(error.message, error.details);
      case ApiErrorCodes.UNAUTHORIZED:
        return new UnauthorizedError(error.message, error.details);
      case ApiErrorCodes.FORBIDDEN:
        return new ForbiddenError(error.message, error.details);
      case ApiErrorCodes.NOT_FOUND:
        return new NotFoundError(error.message || 'Resource', error.details?.id);
      case ApiErrorCodes.CONFLICT:
        return new ConflictError(error.message, error.details);
      case ApiErrorCodes.INTERNAL_ERROR:
        return new ServerError(error.message, error.details);
      case ApiErrorCodes.DATABASE_ERROR:
        return new DatabaseError(error.message, error.details);
      case ApiErrorCodes.EXTERNAL_SERVICE_ERROR:
        return new ExternalServiceError(error.message, error.details);
      case ApiErrorCodes.RATE_LIMITED:
        return new RateLimitError(error.message);
      default:
        return new ApplicationError(
          error.message,
          error.code,
          error.statusCode,
          error.details
        );
    }
  }

  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('Invalid login credentials')) {
      return new SupabaseError(error);
    }
    if (message.includes('Network') || message.includes('fetch')) {
      return new NetworkError(message, { originalError: error });
    }
    if (message.includes('rate limit')) {
      return new RateLimitError(message);
    }

    return new ApplicationError(
      message,
      'UNKNOWN_ERROR',
      500,
      { originalError: error }
    );
  }

  return new ApplicationError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500
  );
}

/**
 * Check if error is an API error with a specific code
 * @param {Error} error - The error to check
 * @param {string} code - The error code to check for
 * @returns {boolean} True if error has the specified code
 */
export function isApiErrorWithCode(error, code) {
  return error.code === code ||
         (error.details?.code === code) ||
         (error.response?.error?.code === code);
}
