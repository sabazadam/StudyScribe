'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'strong' | 'subtle';
  hover?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  variant = 'default',
  hover = true,
  className = '',
  ...motionProps
}: GlassCardProps) {
  const variantClasses = {
    default: 'glass-card',
    strong: 'glass-card-strong',
    subtle: 'backdrop-blur-lg bg-white/50 dark:bg-navy-light/20 border border-white/10 rounded-2xl shadow-lg',
  };

  const hoverAnimation = hover
    ? {
        scale: 1.02,
        y: -4,
        transition: {
          duration: 0.2,
          ease: 'easeOut' as const,
        },
      }
    : undefined;

  return (
    <motion.div
      className={`${variantClasses[variant]} ${className}`}
      whileHover={hoverAnimation}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
