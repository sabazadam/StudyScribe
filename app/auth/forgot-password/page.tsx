/**
 * FORGOT PASSWORD PAGE
 * ==============================================================================
 * Password reset flow using Firebase Authentication
 * Allows users to request a password reset email
 * Handles email validation, rate limiting, and error states
 * ==============================================================================
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ForgotPasswordContent() {
  const { sendPasswordReset, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/create');
    }
  }, [user, router]);

  // Email validation
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Handle email change - clear errors on input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setError('');
  };

  // Handle form submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    // Validation
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await sendPasswordReset(email);

      if (!result.success) {
        // Handle specific Firebase error messages
        const errorMsg = result.error;

        if (errorMsg.includes('user-not-found')) {
          setError('No account found with this email address.');
        } else if (errorMsg.includes('invalid-email')) {
          setEmailError('Invalid email address.');
        } else if (errorMsg.includes('too-many-requests')) {
          setError('Too many reset requests. Please try again later.');
        } else {
          setError(errorMsg || 'Failed to send password reset email.');
        }

        setLoading(false);
        return;
      }

      // Success state
      setSuccess(true);
      setEmail('');
      setLoading(false);
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-academic dark:bg-mesh-academic-dark texture-noise flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-heading font-bold text-gradient-academic mb-2 cursor-pointer hover:opacity-80 transition-opacity">
              CrammingAI
            </h1>
          </Link>
          <p className="text-text-muted dark:text-text-dark-muted">
            Reset your password
          </p>
        </div>

        {/* Password Reset Card */}
        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-heading font-bold text-oxford-blue dark:text-text-dark mb-2">
            Forgot Password?
          </h2>
          <p className="text-sm text-text-muted dark:text-text-dark-muted mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                    Password reset email sent!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Check your email inbox for a link to reset your password. The link expires in 1 hour.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          {!success ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-oxford-blue dark:text-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="Email address"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p
                    id="email-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      warning
                    </span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      refresh
                    </span>
                    Sending email...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">mail</span>
                    Send Reset Link
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Note:</span> Check your email spam/junk folder
                  if you don't see the reset email within a few minutes.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Additional Help */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Didn't receive the email?
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Check your spam/junk folder</li>
                  <li>Check that you entered the correct email</li>
                  <li>Wait a few minutes and refresh your email</li>
                </ul>
              </div>

              {/* Retry Button */}
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
                className="w-full px-4 py-3 border-2 border-primary text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                Try Again
              </button>
            </div>
          )}

          {/* Back to Sign In */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              Remember your password?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:text-primary-dark font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-text-muted dark:text-text-dark-muted hover:text-oxford-blue dark:hover:text-text-dark transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-mesh-academic dark:bg-mesh-academic-dark">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-lg text-text-muted dark:text-text-dark-muted">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
