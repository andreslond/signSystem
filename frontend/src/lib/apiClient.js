/**
 * Centralized API Client for the document signing system.
 * Automatically attaches JWT token from Supabase session.
 * Handles 401 globally with forced logout only for auth failures.
 * Supports the new standardized API response format with success/data/error structure.
 */

import { supabase } from '../lib/supabase';
import { logAppError } from '../utils/errorHandlers';
import { createErrorFromUnknown, NetworkError, AuthError } from '../utils/errors';

// Environment variable for backend base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Standardized API response format
 */
export const ApiResponseFormat = {
  SUCCESS: 'success',
  DATA: 'data',
  ERROR: 'error',
  META: 'meta',
};

/**
 * API Error codes matching backend
 */
export const API_ERROR_CODES = {
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
 * HTTP methods supported by the API client
 */
export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'API_ERROR', details = null, path = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.path = path;
    Error.captureStackTrace(this, ApiError);
  }
}

/**
 * Parse standardized API response
 * @param {Object} response - Raw API response
 * @param {boolean} response.success - Whether the request was successful
 * @param {Object} response.data - Response data on success
 * @param {Object} response.error - Error object on failure
 * @returns {Object} Parsed response with data or throws ApiError
 */
export function parseApiResponse(response) {
  // Handle non-object responses
  if (typeof response !== 'object' || response === null) {
    return { data: response, meta: null };
  }

  // Check for standardized API response format
  if ('success' in response) {
    if (response.success === true) {
      // Success response
      return {
        data: response.data || null,
        meta: response.meta || null,
      };
    }

    // Error response with standardized format
    if (response.success === false && response.error) {
      const error = response.error;
      throw new ApiError(
        error.message || 'An error occurred',
        error.statusCode || 500,
        error.code || 'API_ERROR',
        error.details || null,
        error.path || null
      );
    }
  }

  // Fallback: return as-is for non-standardized responses
  return { data: response, meta: null };
}

/**
 * Pagination parameters interface
 */
export const PaginationParams = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 50,
};

/**
 * Gets the access token from Supabase session
 * @returns {Promise<string | null>} The access token or null
 */
async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    logAppError('apiClient:getAccessToken', error);
    return null;
  }
}

/**
 * Forces user logout on auth failure (401 response from server)
 * Only called when we receive an actual 401, not on network errors
 */
async function handleAuthFailure() {
  try {
    await supabase.auth.signOut();
    // Clear any local storage
    localStorage.removeItem('supabase.auth.token');
    // Redirect to login page
    window.location.href = '/';
  } catch (error) {
    logAppError('apiClient:handleAuthFailure', error);
    // Fallback redirect
    window.location.href = '/';
  }
}

/**
 * Builds query string from params object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * Makes an API request with automatic JWT authentication
 * @param {string} endpoint - API endpoint (will be appended to base URL)
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method
 * @param {Object} options.body - Request body (will be JSON stringified)
 * @param {Object} options.headers - Additional headers
 * @returns {Promise<Object>} JSON response
 * @throws {ApiError} On API or network errors
 */
async function request(endpoint, { method = HttpMethod.GET, body = null, headers = {} } = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get the access token
  const token = await getAccessToken();
  
  if (!token) {
    // No token found - this is an auth failure, but don't logout
    // This could mean user is not logged in yet
    throw new AuthError('No authentication token found');
  }

  // Build headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...headers,
  };

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body !== null) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 401 globally - force logout ONLY on actual 401 response
    // Network errors (no internet) should NOT trigger logout
    if (response.status === 401) {
      logAppError('apiClient:request', new Error(`401 Unauthorized for ${endpoint}`));
      await handleAuthFailure();
      throw new AuthError('Session expired. Please log in again.');
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle non-2xx responses (but not 401, already handled above)
    if (!response.ok) {
      // Try to parse as standardized error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = 'API_ERROR';
      let errorDetails = null;
      let errorPath = null;

      if (typeof data === 'object' && data !== null) {
        // Check for standardized error format
        if (data.success === false && data.error) {
          errorMessage = data.error.message || errorMessage;
          errorCode = data.error.code || errorCode;
          errorDetails = data.error.details || null;
          errorPath = data.error.path || null;
        } else if (data.message) {
          // Fallback to old format
          errorMessage = data.message;
          errorCode = data.code || errorCode;
          errorDetails = data.details || null;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }

      throw new ApiError(errorMessage, response.status, errorCode, errorDetails, errorPath);
    }

    // Parse standardized API response
    return parseApiResponse(data);
  } catch (error) {
    // Handle network errors - DO NOT trigger logout
    // Network errors occur when there's no internet connection
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new NetworkError(
        'Unable to connect to the server. Please check your internet connection.',
        { originalError: error, endpoint }
      );
      logAppError('apiClient:request - Network Error', networkError);
      throw networkError;
    }

    // Re-throw API errors (400, 500, etc.) - DO NOT trigger logout
    // Only 401 triggers logout (handled above)
    if (error instanceof ApiError) {
      throw error;
    }

    // Re-throw Auth errors (no token) - DO NOT trigger logout
    if (error instanceof AuthError) {
      throw error;
    }

    // Wrap other errors
    const wrappedError = createErrorFromUnknown(error);
    logAppError('apiClient:request', wrappedError);
    throw wrappedError;
  }
}

/**
 * GET request wrapper with query parameter support
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters (including pagination)
 * @returns {Promise<Object>} JSON response
 */
export async function get(endpoint, params = {}) {
  const queryString = buildQueryString(params);
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return request(url, { method: HttpMethod.GET });
}

/**
 * POST request wrapper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} JSON response
 */
export async function post(endpoint, body = {}, options = {}) {
  return request(endpoint, { ...options, method: HttpMethod.POST, body });
}

/**
 * PUT request wrapper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} JSON response
 */
export async function put(endpoint, body = {}, options = {}) {
  return request(endpoint, { ...options, method: HttpMethod.PUT, body });
}

/**
 * PATCH request wrapper
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} JSON response
 */
export async function patch(endpoint, body = {}, options = {}) {
  return request(endpoint, { ...options, method: HttpMethod.PATCH, body });
}

/**
 * DELETE request wrapper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} JSON response
 */
export async function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: HttpMethod.DELETE });
}

/**
 * Gets a document URL with authentication
 * Useful for downloading PDFs directly
 * @param {string} documentId - Document ID
 * @returns {Promise<string>} Authenticated document URL
 */
export async function getDocumentUrl(documentId) {
  const token = await getAccessToken();
  return `${API_BASE_URL}/documents/${documentId}/file?token=${token}`;
}

/**
 * Fetch signed PDF URL for a document
 * Returns a time-limited signed URL from GCS for viewing/downloading the PDF
 * @param {string} documentId - Document ID
 * @param {number} expiresInSeconds - URL expiration time in seconds (default: 3600, min: 60, max: 86400)
 * @returns {Promise<Object>} Response with pdfUrl, expiresAt, and pdfType
 */
export async function fetchDocumentPdfUrl(documentId, expiresInSeconds = 3600) {
  const params = {
    expiresInSeconds: Math.max(60, Math.min(expiresInSeconds, 86400)),
  };
  
  return get(`/documents/${documentId}/pdf-url`, params);
}

/**
 * Fetch documents with pagination and optional status filter
 * @param {Object} params - Query parameters
 * @param {string} params.status - Document status filter (PENDING, SIGNED, INVALIDATED)
 * @param {number} params.page - Page number (1-indexed, default: 1)
 * @param {number} params.limit - Items per page (default: 10, max: 50)
 * @returns {Promise<Object>} Response with data and pagination metadata
 */
export async function fetchDocuments({ status, page = PaginationParams.defaultPage, limit = PaginationParams.defaultLimit } = {}) {
  const params = {
    status: status || undefined,
    page,
    limit: Math.min(limit, PaginationParams.maxLimit),
  };
  
  return get('/documents', params);
}

/**
 * Fetch a single document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document data
 */
export async function fetchDocumentById(documentId) {
  return get(`/documents/${documentId}`);
}

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  getDocumentUrl,
  fetchDocuments,
  fetchDocumentById,
  fetchDocumentPdfUrl,
  HttpMethod,
  ApiError,
  ApiResponseFormat,
  API_ERROR_CODES,
  PaginationParams,
  parseApiResponse,
};

