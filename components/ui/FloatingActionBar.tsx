'use client';

import React from 'react';

interface FloatingActionBarProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export default function FloatingActionBar({ children, isVisible }: FloatingActionBarProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed bar */}
      <div className="h-24" />

      {/* Fixed action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
        <div className="glass dark:glass-dark border-t border-border-light dark:border-border-dark shadow-2xl">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
