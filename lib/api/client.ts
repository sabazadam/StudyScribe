/**
 * API CLIENT UTILITIES
 * ==============================================================================
 * Helper functions for making authenticated API requests
 * Automatically adds Firebase auth token to requests
 * ==============================================================================
 */

import { auth } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';

/**
 * Wait for Firebase auth to be ready
 * Fixes race condition where auth.currentUser is null during SSR/rehydration
 *
 * @param timeoutMs - Maximum time to wait (default 5000ms)
 * @returns User object or null if timeout/not authenticated
 */
async function waitForAuth(timeoutMs = 5000): Promise<User | null> {
  // If already loaded, return immediately
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // Wait for auth state to load
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[API Client] Auth wait timeout - user may not be logged in');
      resolve(null);
    }, timeoutMs);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Get authorization header with current user's ID token
 * Waits for auth to be ready before attempting to get token
 *
 * @returns Authorization header object or empty object if not authenticated
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = await waitForAuth();

  if (!user) {
    return {};
  }

  try {
    // Force token refresh to ensure it's not expired
    const token = await user.getIdToken(true);
    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error('[API Client] Failed to get ID token:', error);
    return {};
  }
}

/**
 * Make an authenticated fetch request
 * Automatically adds auth headers and retries on 401 errors
 *
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders,
    },
  };

  const response = await fetch(url, mergedOptions);

  // Retry once on 401 with fresh token
  if (response.status === 401) {
    console.log('[API Client] 401 detected, refreshing token and retrying...');

    // Get fresh auth headers
    const freshHeaders = await getAuthHeaders();

    // Retry the request
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...freshHeaders,
      },
    });
  }

  return response;
}

/**
 * Make an authenticated POST request with JSON body
 *
 * @param url - Request URL
 * @param body - Request body (will be JSON stringified)
 * @returns Fetch response
 */
export async function authenticatedPost(
  url: string,
  body: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated POST request with FormData
 *
 * @param url - Request URL
 * @param formData - FormData object
 * @returns Fetch response
 */
export async function authenticatedFormPost(
  url: string,
  formData: FormData
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: formData,
  });
}
