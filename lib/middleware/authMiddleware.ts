/**
 * AUTHENTICATION MIDDLEWARE
 * ==============================================================================
 * Server-side authentication verification for API routes
 * Uses Firebase Admin SDK to verify ID tokens
 * ==============================================================================
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin (singleton pattern)
if (!admin.apps.length) {
  try {
    // For local development, use environment variables
    // For production, use service account JSON
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const credential = privateKey
      ? admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        })
      : admin.credential.applicationDefault();

    admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    console.log('[Auth Middleware] Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[Auth Middleware] Failed to initialize Firebase Admin:', error);
    // Don't throw - allow app to start, but auth will fail
  }
}

// ==============================================================================
// TYPES
// ==============================================================================

export interface AuthenticatedUser {
  userId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
}

// ==============================================================================
// VERIFY USER AUTHENTICATION
// ==============================================================================

/**
 * Verify user authentication from request headers
 * Extracts and validates Firebase ID token from Authorization header
 *
 * @param request - Next.js Request object
 * @returns Authenticated user info or null if verification fails
 */
export async function verifyUserAuth(
  request: Request
): Promise<AuthenticatedUser | null> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      console.log('[Auth Middleware] No Authorization header found');
      return null;
    }

    // Expect format: "Bearer <token>"
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.log('[Auth Middleware] Invalid Authorization header format');
      return null;
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract user info from decoded token
    const user: AuthenticatedUser = {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };

    console.log('[Auth Middleware] User authenticated:', user.email);
    return user;
  } catch (error: any) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    return null;
  }
}

// ==============================================================================
// OPTIONAL: VERIFY SPECIFIC ROLES/PERMISSIONS
// ==============================================================================

/**
 * Check if user has specific role
 * Requires custom claims to be set in Firebase Auth
 *
 * @param userId - User ID to check
 * @param role - Required role (e.g., 'admin', 'instructor')
 * @returns True if user has role
 */
export async function verifyUserRole(
  userId: string,
  role: string
): Promise<boolean> {
  try {
    const user = await admin.auth().getUser(userId);
    const customClaims = user.customClaims || {};

    return customClaims.role === role || customClaims[role] === true;
  } catch (error) {
    console.error('[Auth Middleware] Failed to verify user role:', error);
    return false;
  }
}

/**
 * Set custom claims for a user
 * Use this to assign roles or permissions
 *
 * @param userId - User ID
 * @param claims - Custom claims object
 */
export async function setUserClaims(
  userId: string,
  claims: Record<string, any>
): Promise<void> {
  try {
    await admin.auth().setCustomUserClaims(userId, claims);
    console.log('[Auth Middleware] Custom claims set for user:', userId);
  } catch (error) {
    console.error('[Auth Middleware] Failed to set custom claims:', error);
    throw error;
  }
}
