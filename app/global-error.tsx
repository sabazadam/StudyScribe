'use client';

/**
 * GLOBAL ERROR BOUNDARY
 * Catches errors in the root layout (last line of defense)
 * Must reset both <html> and <body> tags
 * Integrated with Sentry for error tracking
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error('[Global Error Boundary] Critical error caught:', error);

    // Send to Sentry with highest priority
    Sentry.captureException(error, {
      level: 'fatal',
      tags: { errorBoundary: 'global' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #f0f9ff, #ffffff, #eef2ff)',
          padding: '1.5rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            {/* Error Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                ⚠️
              </div>
            </div>

            {/* Error Title */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '0.75rem',
              color: '#1f2937',
            }}>
              Critical Error
            </h2>

            {/* Error Message */}
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '1.5rem',
              lineHeight: '1.5',
            }}>
              We encountered a critical error in the application. Please reload the page to continue.
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fef2f2',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#991b1b',
                  wordBreak: 'break-all',
                }}>
                  {error.message || 'Unknown critical error'}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    marginTop: '0.5rem',
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Try Again Button */}
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
              >
                🔄 Try Again
              </button>

              {/* Reload Page Button */}
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#4b5563')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#6b7280')}
              >
                🏠 Go Home
              </button>
            </div>

            {/* Help Text */}
            <p style={{
              fontSize: '0.75rem',
              textAlign: 'center',
              color: '#9ca3af',
              marginTop: '1.5rem',
            }}>
              If this error persists, please clear your browser cache and reload.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
