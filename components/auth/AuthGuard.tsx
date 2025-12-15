/**
 * AUTH GUARD COMPONENT
 * ==============================================================================
 * Protects routes by requiring authentication
 * Shows loading spinner during auth check
 * Redirects to sign-in page if not authenticated
 * ==============================================================================
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Store the intended destination for redirect after login
      const redirectUrl = encodeURIComponent(pathname || '/create');
      router.push(`/auth/signin?redirect=${redirectUrl}`);
    }
  }, [user, loading, router, pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-mesh-academic dark:bg-mesh-academic-dark">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-lg text-text-muted dark:text-text-dark-muted">
              Checking authentication...
            </p>
          </div>
        </div>
      )
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated - render protected content
  return <>{children}</>;
}
