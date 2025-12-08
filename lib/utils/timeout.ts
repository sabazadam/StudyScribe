/**
 * TIMEOUT UTILITIES
 * ==============================================================================
 * Utilities for handling request timeouts in AI operations
 * Prevents long-running requests from blocking users
 * ==============================================================================
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout
 * Rejects with TimeoutError if the promise doesn't resolve within the specified time
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 60000ms = 60 seconds)
 * @param operation - Optional operation name for better error messages
 * @returns Promise that resolves/rejects with the original promise or timeout error
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   generateMaterial(transcript),
 *   60000,
 *   'Material Generation'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 60000,
  operation?: string
): Promise<T> {
  const operationName = operation || 'Operation';

  return Sentry.startSpan(
    {
      op: 'function.timeout',
      name: `withTimeout: ${operationName}`,
    },
    async (span) => {
      span.setAttribute('timeout_ms', timeoutMs);
      span.setAttribute('operation', operationName);

      let timeoutId: NodeJS.Timeout;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const error = new TimeoutError(
            `${operationName} timed out after ${timeoutMs}ms`
          );

          // Log timeout to Sentry
          Sentry.captureException(error, {
            level: 'warning',
            tags: {
              operation: operationName,
              timeout_ms: timeoutMs.toString(),
            },
          });

          reject(error);
        }, timeoutMs);
      });

      try {
        // Race between the actual promise and timeout
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        span.setAttribute('completed', true);
        return result;
      } catch (error) {
        clearTimeout(timeoutId!);
        span.setAttribute('completed', false);

        // Tag whether it was a timeout or other error
        if (error instanceof TimeoutError) {
          span.setAttribute('timed_out', true);
        } else {
          span.setAttribute('timed_out', false);
        }

        throw error;
      }
    }
  );
}

/**
 * Retry a promise with timeout multiple times
 * Useful for flaky operations that might succeed on retry
 *
 * @param fn - Function that returns a promise
 * @param options - Configuration options
 * @returns Promise that resolves with the result or rejects after all retries
 *
 * @example
 * ```typescript
 * const result = await withRetryAndTimeout(
 *   () => callGeminiAPI(prompt),
 *   {
 *     maxRetries: 3,
 *     timeoutMs: 60000,
 *     operation: 'Gemini API Call'
 *   }
 * );
 * ```
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    timeoutMs?: number;
    operation?: string;
    retryDelayMs?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 2,
    timeoutMs = 60000,
    operation = 'Operation',
    retryDelayMs = 1000,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await withTimeout(
        fn(),
        timeoutMs,
        `${operation} (attempt ${attempt + 1}/${maxRetries + 1})`
      );
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Log retry attempt
      console.warn(
        `[${operation}] Attempt ${attempt + 1} failed, retrying in ${retryDelayMs}ms...`,
        error
      );

      // Wait before retrying (except for timeouts - fail fast)
      if (!(error instanceof TimeoutError)) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // All retries failed
  Sentry.captureException(lastError, {
    level: 'error',
    tags: {
      operation,
      max_retries: maxRetries.toString(),
      all_retries_failed: 'true',
    },
  });

  throw lastError;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}
