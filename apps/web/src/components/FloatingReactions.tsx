'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const EMOJIS = ['🔥', '❤️', '💃', '😍', '🎸'];

interface Reaction {
  id: number;
  emoji: string;
  x: number;
}

interface FloatingReactionsProps {
  onReact: (emoji: string) => void;
  /** Incoming reaction from others (set briefly, then null) */
  incomingReaction?: string | null;
}

export function FloatingReactions({ onReact, incomingReaction }: FloatingReactionsProps) {
  const [floating, setFloating] = useState<Reaction[]>([]);
  const idRef = useRef(0);

  const addFloating = useCallback((emoji: string) => {
    const id = idRef.current++;
    const x = 10 + Math.random() * 80;
    setFloating((prev) => [...prev.slice(-20), { id, emoji, x }]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  }, []);

  // Show incoming reactions from other users
  useEffect(() => {
    if (incomingReaction) {
      addFloating(incomingReaction);
    }
  }, [incomingReaction, addFloating]);

  const handleTap = (emoji: string) => {
    onReact(emoji);
    addFloating(emoji);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating emojis */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', height: 120, bottom: '100%', zIndex: 10 }}>
        {floating.map((r) => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: `${r.x}%`,
              bottom: 0,
              fontSize: '1.5rem',
              animation: 'floatUp 2s ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Emoji bar */}
      <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>Reaccioná a esta canción</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '4px 0' }}>
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleTap(emoji)}
            style={{
              fontSize: '1.3rem',
              padding: '8px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label={`Reaccionar con ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
