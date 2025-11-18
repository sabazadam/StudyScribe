'use client';

import React, { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
  ripple?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  magnetic = true,
  ripple = true,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative';

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary/50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-accent hover:bg-accent-dark text-white focus:ring-accent/50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50',
    ghost: 'text-primary hover:bg-primary/10 focus:ring-primary/30',
  };

  const sizeStyles = {
    sm: 'py-1.5 px-3 text-sm gap-1.5',
    md: 'py-2 px-4 text-base gap-2',
    lg: 'py-3 px-6 text-lg gap-2.5',
  };

  const buttonClass = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${magnetic ? 'btn-magnetic' : ''}
    ${ripple ? 'btn-ripple' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const iconElement = icon && (
    <span className={`inline-flex ${loading ? 'opacity-0' : ''}`} aria-hidden={loading}>
      {icon}
    </span>
  );

  return (
    <button
      className={buttonClass}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Icon Left */}
      {icon && iconPosition === 'left' && iconElement}

      {/* Button Text */}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>

      {/* Icon Right */}
      {icon && iconPosition === 'right' && iconElement}
    </button>
  );
}
