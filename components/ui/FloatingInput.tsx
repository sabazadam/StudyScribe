'use client';

import { motion } from 'framer-motion';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseFloatingInputProps {
  label: string;
  error?: string;
  icon?: string; // Material icon name
}

type FloatingInputProps = BaseFloatingInputProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type FloatingTextareaProps = BaseFloatingInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

type Props = FloatingInputProps | FloatingTextareaProps;

const FloatingInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, error, icon, as = 'input', className = '', ...props }, ref) => {
    const inputClasses = `peer input-floating ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`;

    return (
      <div className="relative">
        {/* Icon */}
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400 pointer-events-none z-10">
            {icon}
          </span>
        )}

        {/* Input/Textarea */}
        {as === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${inputClasses} ${icon ? 'pl-12' : ''} min-h-[120px] resize-y`}
            placeholder=" "
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={`${inputClasses} ${icon ? 'pl-12' : ''}`}
            placeholder=" "
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {/* Floating Label */}
        <label
          className={`label-floating peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-coral dark:peer-focus:text-cyan ${
            icon ? 'left-12' : 'left-4'
          }`}
        >
          {label}
        </label>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-500 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export default FloatingInput;
