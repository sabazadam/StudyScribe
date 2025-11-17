'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'gradient-mesh' | 'floating-shapes' | 'both';
  className?: string;
}

export default function AnimatedBackground({
  variant = 'both',
  className = ''
}: AnimatedBackgroundProps) {
  const [shapes, setShapes] = useState<Array<{
    id: number;
    size: number;
    x: number;
    y: number;
    duration: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    // Generate random floating shapes
    const generateShapes = () => {
      const colors = [
        'rgba(255, 107, 107, 0.1)', // coral
        'rgba(255, 160, 107, 0.1)', // sunset
        'rgba(0, 217, 255, 0.1)',   // cyan
        'rgba(168, 255, 214, 0.1)', // mint
        'rgba(255, 230, 109, 0.1)', // lemon
      ];

      return Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: Math.random() * 300 + 100,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 10 + 15,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };

    setShapes(generateShapes());
  }, []);

  const showMesh = variant === 'gradient-mesh' || variant === 'both';
  const showShapes = variant === 'floating-shapes' || variant === 'both';

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Gradient Mesh Background */}
      {showMesh && (
        <div className="absolute inset-0 gradient-mesh-bg" />
      )}

      {/* Floating Geometric Shapes */}
      {showShapes && (
        <div className="absolute inset-0">
          {shapes.map((shape) => (
            <motion.div
              key={shape.id}
              className="absolute rounded-full blur-3xl"
              style={{
                width: shape.size,
                height: shape.size,
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                background: shape.color,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: shape.duration,
                delay: shape.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
