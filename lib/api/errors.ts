// ============================================
// API Error Response Helpers
// ============================================
//
// Standardized error response format for all API routes.
// Ensures consistent error handling across the application.

/**
 * Standard API error response format
 */
export interface APIError {
  /** Short error description */
  error: string;

  /** Machine-readable error code (optional) */
  code?: string;

  /** Human-readable error message (optional) */
  message?: string;

  /** Additional context (optional) */
  [key: string]: unknown;
}

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LLM_UNAVAILABLE: 'LLM_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  GENERATION_FAILED: 'GENERATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

/**
 * Create a standardized API error response
 *
 * @param error - Short error description
 * @param status - HTTP status code
 * @param options - Optional code, message, and extra fields
 * @returns Response object with standardized error format
 *
 * @example
 * ```ts
 * // Simple validation error
 * return apiError('Question is required', 400);
 *
 * // Error with code and message
 * return apiError('LLM provider not available', 503, {
 *   code: 'LLM_UNAVAILABLE',
 *   message: 'AI service is not configured. Please set up API keys.'
 * });
 *
 * // Error with extra fields
 * return apiError('Rate limit exceeded', 429, {
 *   code: 'RATE_LIMIT_EXCEEDED',
 *   message: 'Too many requests. Please wait before trying again.',
 *   retryAfter: 60
 * });
 * ```
 */
export function apiError(
  error: string,
  status: number,
  options?: {
    code?: string;
    message?: string;
    [key: string]: unknown;
  }
): Response {
  const { code, message, ...extra } = options || {};

  const errorBody: APIError = {
    error,
    ...(code && { code }),
    ...(message && { message }),
    ...extra,
  };

  return Response.json(errorBody, { status });
}

/**
 * Common error responses
 */
export const commonErrors = {
  /** Invalid request parameters */
  validationError: (field: string) =>
    apiError(`${field} is required`, HTTP_STATUS.BAD_REQUEST, {
      code: ERROR_CODES.VALIDATION_ERROR,
    }),

  /** LLM service unavailable */
  llmUnavailable: () =>
    apiError('LLM provider not available', HTTP_STATUS.SERVICE_UNAVAILABLE, {
      code: ERROR_CODES.LLM_UNAVAILABLE,
      message: 'AI service is not configured. Please set up API keys in .env.local',
    }),

  /** Resource not found */
  notFound: (resource: string) =>
    apiError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, {
      code: ERROR_CODES.NOT_FOUND,
    }),

  /** Internal server error */
  internalError: (error: unknown) =>
    apiError('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }),

  /** Rate limit exceeded */
  rateLimitExceeded: (retryAfter: number) =>
    apiError('Rate limit exceeded', HTTP_STATUS.TOO_MANY_REQUESTS, {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please wait before trying again.',
      retryAfter,
    }),
};
