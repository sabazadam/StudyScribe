'use client';

import { useEffect, useState } from 'react';

/**
 * SuccessAnimation Component
 * Animated checkmark for successful actions with optional confetti
 */

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number; // in milliseconds
  size?: 'sm' | 'md' | 'lg';
}

export default function SuccessAnimation({
  show,
  message = 'Success!',
  onComplete,
  duration = 3000,
  size = 'md'
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const strokeWidth = {
    sm: 3,
    md: 4,
    lg: 5
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-blue/20 backdrop-blur-sm animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl p-8 animate-success-pop">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Checkmark SVG */}
          <svg
            className={`${sizeClasses[size]} text-green-500`}
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Circle */}
            <circle
              className="checkmark-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth[size]}
            />
            {/* Checkmark */}
            <path
              className="checkmark-check"
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth[size]}
              strokeLinecap="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>

          {/* Success Message */}
          <div className="text-center">
            <h3 className="text-2xl font-heading font-bold text-midnight-blue dark:text-white mb-1">
              {message}
            </h3>
            <p className="text-sm text-text-light/60 dark:text-text-dark/60">
              Operation completed successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini success toast for inline feedback
 */
interface SuccessToastProps {
  show: boolean;
  message: string;
  position?: 'top' | 'bottom';
}

export function SuccessToast({ show, message, position = 'bottom' }: SuccessToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4';

  return (
    <div
      className={`fixed ${positionClasses} right-4 z-50 animate-slide-in-right`}
      role="status"
      aria-live="polite"
    >
      <div className="glass dark:glass-dark px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[200px]">
        {/* Success Icon */}
        <svg
          className="w-6 h-6 text-green-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium text-midnight-blue dark:text-white">
          {message}
        </span>
      </div>
    </div>
  );
}

/**
 * Progress success indicator
 */
interface ProgressSuccessProps {
  steps: string[];
  currentStep: number;
  completed: boolean;
}

export function ProgressSuccess({ steps, currentStep, completed }: ProgressSuccessProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isComplete = index < currentStep || completed;
        const isCurrent = index === currentStep && !completed;

        return (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-300 ${
              isComplete ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-40'
            }`}
          >
            {/* Status Indicator */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                ${isComplete ? 'bg-green-500 animate-success-pop' : isCurrent ? 'bg-primary animate-pulse' : 'bg-text-light/20'}
              `}
            >
              {isComplete ? (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-sm font-bold text-white">{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <span
              className={`font-medium ${
                isComplete ? 'text-green-600 dark:text-green-400' : isCurrent ? 'text-primary' : 'text-text-light/60'
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
