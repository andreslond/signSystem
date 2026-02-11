/**
 * Custom Error Classes following error-handling-patterns skill.
 * Provides structured error handling with codes, status codes, and metadata.
 */

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
    super(message, 'VALIDATION_ERROR', 400, details);
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
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Not found error - raised when a resource is not found.
 */
export class NotFoundError extends ApplicationError {
  constructor(resource, id = null) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id });
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
      code = 'RATE_LIMIT_EXCEEDED';
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
