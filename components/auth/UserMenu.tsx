/**
 * USER MENU COMPONENT
 * ==============================================================================
 * Displays user info and authentication actions in navigation
 * Shows sign in/sign up buttons when not authenticated
 * Shows user menu with sign out when authenticated
 * ==============================================================================
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';
import SignUpModal from './SignUpModal';

export default function UserMenu() {
  const { user, userProfile, signOut, loading } = useAuth();
  const router = useRouter();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Daily usage state
  const [dailyUsage, setDailyUsage] = useState<{
    materials: { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' };
    images: { used: number; limit: number | 'unlimited'; remaining: number | 'unlimited' };
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Fetch daily usage from API
  const fetchDailyUsage = async () => {
    if (!user) return;

    try {
      setLoadingUsage(true);
      setUsageError(null);

      const token = await user.getIdToken();
      const response = await fetch('/api/usage/daily', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      setDailyUsage(data.usage);
    } catch (error) {
      console.error('[UserMenu] Error fetching daily usage:', error);
      setUsageError('Failed to load usage data');
    } finally {
      setLoadingUsage(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      setShowDropdown(false);
      router.push('/');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
    );
  }

  // Show sign in/sign up buttons if not authenticated
  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 text-oxford-blue dark:text-text-dark hover:text-primary dark:hover:text-primary transition-colors font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowSignUpModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
          >
            Sign Up
          </button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignUp={() => {
            setShowLoginModal(false);
            setShowSignUpModal(true);
          }}
        />

        <SignUpModal
          isOpen={showSignUpModal}
          onClose={() => setShowSignUpModal(false)}
          onSwitchToLogin={() => {
            setShowSignUpModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  // Show user menu if authenticated
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          // Fetch usage when opening dropdown for first time
          if (!showDropdown && !dailyUsage) {
            fetchDailyUsage();
          }
        }}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="User menu"
        aria-expanded={showDropdown}
      >
        {/* User avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}

        {/* User name (desktop only) */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-oxford-blue dark:text-text-dark">
            {user.displayName || 'User'}
          </span>
          {userProfile && (
            <span className="text-xs text-text-muted dark:text-text-dark-muted capitalize">
              {userProfile.subscriptionTier} Plan
            </span>
          )}
        </div>

        {/* Dropdown icon */}
        <span className="material-symbols-outlined text-sm text-gray-500">
          {showDropdown ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slide-up">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-oxford-blue dark:text-text-dark truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-text-muted dark:text-text-dark-muted truncate">
              {user.email}
            </p>
            {userProfile && (
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium capitalize">
                  {userProfile.subscriptionTier}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-text-dark-muted text-xs rounded-full capitalize">
                  {userProfile.role}
                </span>
              </div>
            )}
          </div>

          {/* Usage stats */}
          {userProfile && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-text-muted dark:text-text-dark-muted uppercase mb-2">
                Daily Quota
              </p>

              {loadingUsage ? (
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : usageError ? (
                <p className="text-xs text-red-600 dark:text-red-400">{usageError}</p>
              ) : dailyUsage ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted dark:text-text-dark-muted">Materials</span>
                    <span className="font-medium text-oxford-blue dark:text-text-dark">
                      {dailyUsage.materials.remaining === 'unlimited'
                        ? '∞ remaining'
                        : `${dailyUsage.materials.remaining} left`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted dark:text-text-dark-muted">Images</span>
                    <span className="font-medium text-oxford-blue dark:text-text-dark">
                      {dailyUsage.images.remaining === 'unlimited'
                        ? '∞ remaining'
                        : `${dailyUsage.images.remaining} left`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted dark:text-text-dark-muted">Materials</span>
                    <span className="font-medium text-oxford-blue dark:text-text-dark">
                      {userProfile.quota.dailyMaterialsLimit} available
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted dark:text-text-dark-muted">Images</span>
                    <span className="font-medium text-oxford-blue dark:text-text-dark">
                      {userProfile.quota.dailyImagesLimit} available
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push('/hub');
              }}
              className="w-full px-4 py-2 text-left text-sm text-oxford-blue dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">folder</span>
              My Study Hub
            </button>
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push('/settings');
              }}
              className="w-full px-4 py-2 text-left text-sm text-oxford-blue dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              Settings
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
