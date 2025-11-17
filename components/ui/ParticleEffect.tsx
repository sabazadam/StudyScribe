'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
}

interface ParticleEffectProps {
  trigger: boolean;
  particleCount?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

export default function ParticleEffect({
  trigger,
  particleCount = 30,
  colors = ['#FF6B6B', '#FFA06B', '#00D9FF', '#A8FFD6', '#FFE66D'],
  origin = { x: 50, y: 50 },
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
        const angle = (360 / particleCount) * i;
        return {
          id: Date.now() + i,
          x: origin.x,
          y: origin.y,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          angle,
        };
      });

      setParticles(newParticles);

      // Clean up after animation
      setTimeout(() => {
        setParticles([]);
      }, 1500);
    }
  }, [trigger, particleCount, colors, origin]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const distance = 200;
          const endX = origin.x + Math.cos(radians) * distance;
          const endY = origin.y + Math.sin(radians) * distance;

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: (endX - particle.x) * 5,
                y: (endY - particle.y) * 5,
                scale: 0,
                opacity: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 1.2,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
