// ============================================
// HTTP Client Adapter
// ============================================
//
// Handles all HTTP communication with the backend API.
// Features: retry logic, timeout, error handling, response transformation.

import { getAPIUrl } from '@/lib/config/features';

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout: number; // ms
  maxRetries: number;
  retryDelay: number; // ms (exponential backoff)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: HttpClientConfig = {
  baseURL: getAPIUrl(),
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
};

/**
 * HTTP error class
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Make HTTP request with retry logic
 */
export async function httpRequest<T>(
  path: string,
  options: RequestInit = {},
  config: Partial<HttpClientConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const url = `${finalConfig.baseURL}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

      // Make request with cookies
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for session
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new HttpError(
          response.status,
          errorData.error?.code || 'UNKNOWN_ERROR',
          errorData.error?.message || `HTTP ${response.status}`,
          errorData.error?.requestId
        );
      }

      // Handle 204 No Content (DELETE responses)
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof HttpError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(2, attempt);
      console.warn(`[HTTP] Retry ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * HTTP GET request
 */
export async function httpGet<T>(path: string, config?: Partial<HttpClientConfig>): Promise<T> {
  return httpRequest<T>(path, { method: 'GET' }, config);
}

/**
 * HTTP POST request
 */
export async function httpPost<T>(
  path: string,
  body: unknown,
  config?: Partial<HttpClientConfig>
): Promise<T> {
  return httpRequest<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    config
  );
}

/**
 * HTTP PATCH request
 */
export async function httpPatch<T>(
  path: string,
  body: unknown,
  config?: Partial<HttpClientConfig>
): Promise<T> {
  return httpRequest<T>(
    path,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    config
  );
}

/**
 * HTTP DELETE request
 */
export async function httpDelete<T>(path: string, config?: Partial<HttpClientConfig>): Promise<T> {
  return httpRequest<T>(path, { method: 'DELETE' }, config);
}
