/**
 * AUTHENTICATION CONTEXT
 * ==============================================================================
 * Provides Firebase authentication state throughout the application
 * Manages user session, loading states, and auth functions
 * ==============================================================================
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
  getUserProfile,
  type UserProfile,
} from '@/lib/firebase/auth';

// ==============================================================================
// TYPES
// ==============================================================================

interface AuthContextType {
  // User state
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;

  // Auth functions
  signUp: (email: string, password: string, displayName: string) => Promise<{ user: User; error: null } | { user: null; error: string }>;
  signIn: (email: string, password: string) => Promise<{ user: User; error: null } | { user: null; error: string }>;
  signInWithGoogle: () => Promise<{ user: User; error: null } | { user: null; error: string }>;
  signOut: () => Promise<{ success: true } | { success: false; error: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: true } | { success: false; error: string }>;

  // Utilities
  getIdToken: () => Promise<string | null>;
}

// ==============================================================================
// CONTEXT
// ==============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==============================================================================
// PROVIDER COMPONENT
// ==============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Fetch user profile from Firestore if user is authenticated
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get current user's ID token for API calls
  const getIdToken = async (forceRefresh = false): Promise<string | null> => {
    if (!user) return null;

    try {
      // Force refresh to ensure token is not expired
      const token = await user.getIdToken(forceRefresh);
      return token;
    } catch (error) {
      console.error('[Auth] Failed to get ID token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp: signUpWithEmail,
    signIn: signInWithEmail,
    signInWithGoogle,
    signOut: firebaseSignOut,
    sendPasswordReset: resetPassword,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==============================================================================
// HOOK
// ==============================================================================

/**
 * Hook to access authentication context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
