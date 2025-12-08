/**
 * FIREBASE ADMIN SDK CONFIGURATION
 * ==============================================================================
 * Initialize Firebase Admin SDK for server-side operations
 * Provides singleton instance for admin firestore and auth
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

    console.log('[Firebase Admin] Admin SDK initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize Admin SDK:', error);
    // Don't throw - allow app to start, but operations will fail
  }
}

// Export Admin Firestore instance
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

export default admin;

// Export config info for debugging (remove sensitive data)
export const getAdminConfigInfo = () => ({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  hasPrivateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  hasClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
  isConfigured: admin.apps.length > 0,
});
