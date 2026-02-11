/**
 * Retry utility with exponential backoff.
 * Follows error-handling-patterns skill for resilient network operations.
 */

/**
 * Sleep utility for delays.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Default retryable errors (network-related).
 */
const DEFAULT_RETRYABLE_ERRORS = [
  'NetworkError',
  'TypeError', // Often network-related in fetch
  'AbortError',
];

/**
 * Checks if an error is retryable based on type or message.
 */
const isRetryableError = (error) => {
  // Check error name
  if (DEFAULT_RETRYABLE_ERRORS.includes(error.name)) {
    return true;
  }

  // Check error message for network-related keywords
  const message = error.message?.toLowerCase() || '';
  const networkKeywords = ['network', 'fetch', 'timeout', 'econn', 'enotfound'];

  if (networkKeywords.some(keyword => message.includes(keyword))) {
    return true;
  }

  // Check if it's a rate limit error (429)
  if (error.statusCode === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
    return true;
  }

  return false;
};

/**
 * Retry a function with exponential backoff.
 *
 * @param {Function} fn - The async function to retry.
 * @param {Object} options - Retry options.
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3).
 * @param {number} options.baseDelay - Base delay in ms (default: 1000).
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000).
 * @param {Function} options.shouldRetry - Custom function to determine if error is retryable.
 * @param {Function} options.onRetry - Callback called before each retry.
 * @returns {Promise} - Result of the function or throws after max attempts.
 */
export async function retry(
  fn,
  {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isRetryableError,
    onRetry = null,
  } = {}
) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts;
      const canRetry = shouldRetry(error);

      if (!canRetry || isLastAttempt) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

      // Add jitter (10% randomness) to prevent thundering herd
      const jitter = delay * 0.1 * (Math.random() - 0.5);
      const actualDelay = Math.floor(delay + jitter);

      console.warn(
        `[Retry] Attempt ${attempt} failed: ${error.message}. ` +
        `Retrying in ${actualDelay}ms...`
      );

      if (onRetry) {
        onRetry(error, attempt, actualDelay);
      }

      await sleep(actualDelay);
    }
  }

  throw lastError;
}

/**
 * Creates a retryable version of a function.
 *
 * @param {Function} fn - The async function to wrap.
 * @param {Object} options - Retry options.
 * @returns {Function} - Retryable function.
 */
export function withRetry(fn, options = {}) {
  return (...args) => retry(() => fn(...args), options);
}

/**
 * Retry configuration hook for React components.
 */
export const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};
