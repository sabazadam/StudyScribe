/**
 * SENTRY ERROR TRACKING
 * ==============================================================================
 * Error tracking and monitoring configuration
 * Captures exceptions, performance issues, and user feedback
 * ==============================================================================
 */

import * as Sentry from '@sentry/nextjs';

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Initialize Sentry (call this in app/layout.tsx)
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Sample rate for error events (1.0 = 100%)
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Capture 100% of errors in production
    sampleRate: 1.0,

    // Enable performance monitoring
    integrations: [
      // BrowserTracing is now automatically enabled by Sentry
      // Replay integration removed for now - can be configured later in sentry.client.config.ts
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive query parameters
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/[?&]key=[^&]+/, '');
      }

      // Don't send events in development unless explicitly enabled
      if (ENVIRONMENT === 'development' && !process.env.SENTRY_DEBUG) {
        return null;
      }

      return event;
    },
  });
}

// ==============================================================================
// ERROR CAPTURING HELPERS
// ==============================================================================

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: {
    component?: string;
    userId?: string;
    action?: string;
    extra?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    tags: {
      component: context?.component,
      action: context?.action,
    },
    user: context?.userId ? { id: context.userId } : undefined,
    extra: context?.extra,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on sign out)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// ==============================================================================
// PERFORMANCE MONITORING
// ==============================================================================

/**
 * Start a performance transaction
 * DEPRECATED: This function is deprecated in Sentry v8
 * Use Sentry.startSpan() directly instead
 */
export function startTransaction(name: string, op: string) {
  // Legacy no-op for compatibility
  // Sentry v8 no longer supports startTransaction()
  // Performance tracking is automatic now
  return {
    finish: () => {},
    setTag: (...args: any[]) => {},
    setData: (...args: any[]) => {},
    setStatus: (...args: any[]) => {},
    setName: (...args: any[]) => {},
    setContext: (...args: any[]) => {},
  };
}

/**
 * Measure async operation performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

// ==============================================================================
// ERROR BOUNDARY INTEGRATION
// ==============================================================================

/**
 * Report error from React Error Boundary
 */
export function reportBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
) {
  Sentry.withScope((scope) => {
    scope.setContext('react', {
      componentStack: errorInfo.componentStack,
    });
    Sentry.captureException(error);
  });
}
