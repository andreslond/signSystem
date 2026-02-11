import { useCallback } from 'react';
import { logAppError } from '../utils/errorHandlers';
import { createErrorFromUnknown, ApplicationError } from '../utils/errors';

/**
 * Custom hook for consistent error handling in React components.
 * Follows error-handling-patterns skill best practices.
 */
export default function useErrorHandler(context = 'Unknown') {
  const handleError = useCallback((error, customContext = context) => {
    // Convert unknown error to structured error
    const structuredError = createErrorFromUnknown(error);

    // Log the error with context
    logAppError(customContext, structuredError);

    // In development, also log to console
    if (import.meta.env.DEV) {
      console.error(`[ErrorHandler][${customContext}]:`, structuredError);
    }

    // Return error for component to handle
    return structuredError;
  }, [context]);

  const handleAsyncError = useCallback(async (promise, customContext = context) => {
    try {
      const result = await promise;
      return { ok: true, data: result, error: null };
    } catch (error) {
      const structuredError = handleError(error, customContext);
      return { ok: false, data: null, error: structuredError };
    }
  }, [context, handleError]);

  const createAppError = useCallback((message, code = 'APP_ERROR', statusCode = 500, details = null) => {
    return new ApplicationError(message, code, statusCode, details);
  }, []);

  return {
    handleError,
    handleAsyncError,
    createAppError,
  };
}

/**
 * Higher-order component wrapper for error handling.
 * Wraps a component with error boundary and provides error handling methods.
 */
export function withErrorHandler(WrappedComponent, context = 'WrappedComponent') {
  return function ErrorHandlerWrapper(props) {
    const errorHandler = useErrorHandler(context);

    return (
      <WrappedComponent
        {...props}
        errorHandler={errorHandler}
      />
    );
  };
}

/**
 * Error handling configuration for different error types.
 */
export const errorHandlers = {
  validation: (error, setError) => {
    if (error.code === 'VALIDATION_ERROR') {
      setError(error.message);
      return true;
    }
    return false;
  },

  auth: (error, onAuthError) => {
    if (error.code === 'AUTH_ERROR' ||
        error.code === 'INVALID_CREDENTIALS' ||
        error.code === 'EMAIL_NOT_CONFIRMED') {
      onAuthError(error);
      return true;
    }
    return false;
  },

  network: (error, onNetworkError) => {
    if (error.code === 'NETWORK_ERROR' || error.statusCode === 0) {
      onNetworkError(error);
      return true;
    }
    return false;
  },

  rateLimit: (error, onRateLimit) => {
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.statusCode === 429) {
      onRateLimit(error);
      return true;
    }
    return false;
  },

  default: (error, onDefaultError) => {
    onDefaultError(error);
    return true;
  },
};
