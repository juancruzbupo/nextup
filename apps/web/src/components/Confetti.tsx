'use client';

import { useEffect, useState, useRef } from 'react';

const COLORS = ['#1DB954', '#4ade80', '#22d95f', '#f59e0b', '#ff4757', '#3b82f6', '#eeeeee'];
const PARTICLE_COUNT = 40;

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!trigger) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 300,
      duration: 1500 + Math.random() * 1000,
      size: 4 + Math.random() * 6,
    }));
    setParticles(newParticles);
    timeoutRef.current = setTimeout(() => setParticles([]), 3000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            borderRadius: p.size > 7 ? '50%' : '2px',
            background: p.color,
            animation: `confettiFall ${p.duration}ms ease-in ${p.delay}ms forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
