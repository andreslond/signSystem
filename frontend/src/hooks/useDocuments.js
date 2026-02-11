/**
 * useDocuments Hook
 * Manages document fetching, state, and refetching with pagination support.
 * Handles network errors gracefully without redirect loops.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDocuments, ApiError, fetchDocumentById } from '../lib/apiClient';
import { NetworkError } from '../utils/errors';
import { logAppError } from '../utils/errorHandlers';

/**
 * Document status types
 */
export const DocumentStatus = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  INVALIDATED: 'INVALIDATED',
};

/**
 * Pagination state factory
 */
function createPaginationState(initialPage = 1, initialLimit = 10) {
  return {
    page: initialPage,
    limit: initialLimit,
    totalPages: 1,
    total: 0,
  };
}

/**
 * Hook for fetching and managing documents with pagination
 * Prevents infinite loops on network errors by tracking mounted state
 */
export function useDocuments({ 
  status = null, 
  initialPage = 1, 
  initialLimit = 10 
} = {}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState(() => createPaginationState(initialPage, initialLimit));

  // Track mounted state to prevent updates after unmount
  const isMounted = useRef(true);
  
  // Track current request to prevent race conditions
  const requestId = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    requestId.current = 0;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Fetch documents with current pagination state
   */
  const fetchDocumentsData = useCallback(async () => {
    // Increment request ID to track latest request
    const currentRequestId = ++requestId.current;
    
    // Don't set loading to true on refetch if we already have data
    const isRefetch = documents.length > 0;
    if (!isRefetch) {
      setLoading(true);
    }
    setError(null);
    setSuccess(false);

    try {
      const response = await fetchDocuments({
        status,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      // Check if this is still the latest request
      if (currentRequestId !== requestId.current) {
        return;
      }
      
      // Handle different response formats
      const documentsData = Array.isArray(response?.data) 
        ? response.data 
        : Array.isArray(response)
          ? response
          : [];
      
      // Extract pagination metadata
      const paginationMeta = response?.pagination || {
        total: documentsData.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: 1,
      };

      if (!isMounted.current) return;
      
      setDocuments(documentsData);
      setPagination(prev => ({
        ...prev,
        total: paginationMeta.total,
        totalPages: paginationMeta.totalPages,
      }));
      setSuccess(true);
      
    } catch (err) {
      // Check if this is still the latest request
      if (currentRequestId !== requestId.current) {
        return;
      }
      
      if (!isMounted.current) return;
      
      // Network errors should NOT cause redirects or session clearing
      // They should just show an error state
      const isNetworkError = err instanceof NetworkError;
      const isAuthError = err instanceof ApiError && err.statusCode === 401;
      
      // Only log non-network errors to avoid noise
      if (!isNetworkError) {
        logAppError('useDocuments:fetchDocuments', err);
      }
      
      setError({
        message: err.message || 'Error al cargar documentos',
        statusCode: err.statusCode || 0,
        isNetworkError,
        isAuthError,
        code: err.code || 'UNKNOWN_ERROR',
      });
      setDocuments([]);
      
      // Network errors should not change success state
      // This prevents infinite loops
      if (!isNetworkError) {
        setSuccess(false);
      }
    } finally {
      // Only update loading if this is still the latest request
      if (currentRequestId === requestId.current && isMounted.current) {
        setLoading(false);
      }
    }
  }, [status, pagination.page, pagination.limit, documents.length]);

  // Fetch on mount and when pagination/status changes
  useEffect(() => {
    fetchDocumentsData();
  }, [fetchDocumentsData]);

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, pagination.totalPages));
    setPagination(prev => ({
      ...prev,
      page: validPage,
    }));
  }, [pagination.totalPages]);

  /**
   * Navigate to the next page
   */
  const nextPage = useCallback(() => {
    goToPage(pagination.page + 1);
  }, [pagination.page, pagination.totalPages]);

  /**
   * Navigate to the previous page
   */
  const prevPage = useCallback(() => {
    goToPage(pagination.page - 1);
  }, [pagination.page]);

  /**
   * Change the number of items per page
   */
  const setLimit = useCallback((limit) => {
    setPagination(prev => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
    }));
  }, []);

  /**
   * Refetch current page - safe to call multiple times
   */
  const refetch = useCallback(async () => {
    // Increment request ID to cancel any pending requests
    requestId.current++;
    
    // Small delay to allow state to reset
    await new Promise(resolve => setTimeout(resolve, 50));
    await fetchDocumentsData();
  }, [fetchDocumentsData]);

  return {
    documents,
    loading,
    error,
    success,
    refetch,
    isEmpty: !loading && success && documents.length === 0,
    // Pagination state and methods
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
      goToPage,
      nextPage,
      prevPage,
      setLimit,
      resetToFirstPage: () => setPagination(prev => ({ ...prev, page: 1 })),
    },
  };
}

/**
 * Hook for fetching a single document by ID
 */
export function useDocument(documentId) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isMounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    requestId.current = 0;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!documentId) {
      setError(new Error('Document ID is required'));
      setLoading(false);
      return;
    }

    const fetchDocument = async () => {
      const currentRequestId = ++requestId.current;
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        console.log(`Fetching document with ID: ${documentId}`);
        const response = await fetchDocumentById(documentId);
        
        if (currentRequestId !== requestId.current) return;
        if (!isMounted.current) return;
        
        const documentData = response?.data || response?.document || response;
        console.log('Fetched document data:', JSON.stringify(documentData, null, 2));
        setDocument(documentData);
        setSuccess(true);
      } catch (err) {
        if (currentRequestId !== requestId.current) return;
        if (!isMounted.current) return;
        
        // Network errors should not cause redirects
        const isNetworkError = err instanceof NetworkError;
        
        if (!isNetworkError) {
          logAppError('useDocument:fetchDocument', err);
        }
        
        setError({
          message: err.message || 'Error al cargar el documento',
          statusCode: err.statusCode || 0,
          isNetworkError,
          code: err.code || 'UNKNOWN_ERROR',
        });
        setDocument(null);
        
        if (!isNetworkError) {
          setSuccess(false);
        }
      } finally {
        if (currentRequestId === requestId.current && isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchDocument();
  }, [documentId]);

  const refetch = useCallback(async () => {
    if (!documentId) return;
    
    requestId.current++;
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (isMounted.current) {
      setLoading(true);
    }
    
    try {
      const response = await fetchDocumentById(documentId);
      if (isMounted.current) {
        const documentData = response?.data || response?.document || response;
        setDocument(documentData);
        setSuccess(true);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      const isNetworkError = err instanceof NetworkError;
      if (!isNetworkError) {
        logAppError('useDocument:refetch', err);
      }
      
      setError({
        message: err.message || 'Error al cargar el documento',
        statusCode: err.statusCode || 0,
        isNetworkError,
        code: err.code || 'UNKNOWN_ERROR',
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [documentId]);

  return {
    document,
    loading,
    error,
    success,
    refetch,
  };
}

export default useDocuments;
