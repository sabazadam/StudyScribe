/**
 * SAFE STORAGE UTILITIES
 * ==============================================================================
 * Safe wrappers for browser storage APIs that work with Server-Side Rendering
 *
 * Problem: sessionStorage and localStorage are not available during SSR
 * Solution: Check if we're in browser environment before accessing
 * ==============================================================================
 */

/**
 * Safely set an item in sessionStorage
 * @param key - Storage key
 * @param value - Value to store (will be stringified)
 * @returns true if successful, false if failed or not in browser
 */
export function setSessionItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    // Server-side rendering - storage not available
    return false;
  }

  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to set sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely get an item from sessionStorage
 * @param key - Storage key
 * @returns Value if found and in browser, null otherwise
 */
export function getSessionItem(key: string): string | null {
  if (typeof window === 'undefined') {
    // Server-side rendering - storage not available
    return null;
  }

  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to get sessionStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safely remove an item from sessionStorage
 * @param key - Storage key
 * @returns true if successful, false if failed or not in browser
 */
export function removeSessionItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to remove sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all sessionStorage
 * @returns true if successful, false if failed or not in browser
 */
export function clearSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear sessionStorage:', error);
    return false;
  }
}

/**
 * Safely set an item in localStorage
 * @param key - Storage key
 * @param value - Value to store (will be stringified)
 * @returns true if successful, false if failed or not in browser
 */
export function setLocalItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely get an item from localStorage
 * @param key - Storage key
 * @returns Value if found and in browser, null otherwise
 */
export function getLocalItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safely remove an item from localStorage
 * @param key - Storage key
 * @returns true if successful, false if failed or not in browser
 */
export function removeLocalItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage
 * @returns true if successful, false if failed or not in browser
 */
export function clearLocal(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Check if we're running in a browser environment
 * @returns true if in browser, false if on server
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
