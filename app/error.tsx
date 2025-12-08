'use client';

/**
 * ERROR BOUNDARY
 * Catches React errors and prevents white screen crashes
 * Shows user-friendly error messages with retry functionality
 * Integrated with Sentry for error tracking
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('[Error Boundary] Caught error:', error);

    // Send to Sentry error tracking service
    Sentry.captureException(error, {
      level: 'error',
      tags: { errorBoundary: 'page' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-midnight-blue dark:via-midnight-blue dark:to-deep-purple p-6">
      <div className="max-w-md w-full">
        <div className="glass dark:glass-dark rounded-xl p-8 border border-border-light dark:border-border-dark shadow-xl">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">
                error
              </span>
            </div>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-heading font-bold text-center mb-3 text-primary-text dark:text-primary-text-dark">
            Something went wrong
          </h2>

          {/* Error Message */}
          <p className="text-center text-secondary-text dark:text-secondary-text-dark mb-6">
            We encountered an unexpected error while processing your request. Don't worry, your data is safe.
          </p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                {error.message || 'Unknown error'}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Try Again Button */}
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Try Again
            </button>

            {/* Go Home Button */}
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full px-6 py-3 bg-secondary-light hover:bg-secondary text-white rounded-lg transition-all shadow-sm hover:shadow-md font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">home</span>
              Go to Home
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-secondary-text dark:text-secondary-text-dark mt-6">
            If this error persists, please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
