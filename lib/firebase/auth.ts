/**
 * FIREBASE AUTHENTICATION HELPERS
 * ==============================================================================
 * Helper functions for user authentication with Firebase
 * Supports email/password and Google sign-in
 * ==============================================================================
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ==============================================================================
// USER PROFILE TYPES
// ==============================================================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'instructor' | 'admin';
  subscriptionTier: 'free' | 'student' | 'premium';
  createdAt: any; // Firestore Timestamp
  lastLoginAt: any; // Firestore Timestamp
  usage: {
    materialsGenerated: number;
    imagesGenerated: number;
    quizzesCreated: number;
  };
  quota: {
    dailyMaterialsLimit: number;
    dailyImagesLimit: number;
  };
}

// ==============================================================================
// SIGN UP WITH EMAIL/PASSWORD
// ==============================================================================

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  try {
    // Create user account
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update display name
    await updateProfile(userCredential.user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(userCredential.user, 'student', 'free');

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('[Auth] Sign up error:', error);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// ==============================================================================
// SIGN IN WITH EMAIL/PASSWORD
// ==============================================================================

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update last login time
    await updateLastLogin(userCredential.user.uid);

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('[Auth] Sign in error:', error);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// ==============================================================================
// SIGN IN WITH GOOGLE
// ==============================================================================

export async function signInWithGoogle(): Promise<
  { user: User; error: null } | { user: null; error: string }
> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);

    // Check if user profile exists, create if not
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await createUserProfile(userCredential.user, 'student', 'free');
    } else {
      await updateLastLogin(userCredential.user.uid);
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('[Auth] Google sign in error:', error);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

// ==============================================================================
// SIGN OUT
// ==============================================================================

export async function signOut(): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Sign out error:', error);
    return { success: false, error: 'Failed to sign out. Please try again.' };
  }
}

// ==============================================================================
// PASSWORD RESET
// ==============================================================================

export async function resetPassword(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Password reset error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// ==============================================================================
// USER PROFILE MANAGEMENT
// ==============================================================================

/**
 * Create user profile in Firestore
 */
async function createUserProfile(
  user: User,
  role: 'student' | 'instructor' | 'admin',
  subscriptionTier: 'free' | 'student' | 'premium'
): Promise<void> {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Anonymous',
    photoURL: user.photoURL || undefined,
    role,
    subscriptionTier,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    usage: {
      materialsGenerated: 0,
      imagesGenerated: 0,
      quizzesCreated: 0,
    },
    quota: {
      dailyMaterialsLimit: subscriptionTier === 'free' ? 5 : 20,
      dailyImagesLimit: subscriptionTier === 'free' ? 2 : 10,
    },
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin(uid: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[Auth] Failed to update last login:', error);
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Failed to get user profile:', error);
    return null;
  }
}

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request is allowed at a time.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}

// ==============================================================================
// CURRENT USER HELPERS
// ==============================================================================

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}
