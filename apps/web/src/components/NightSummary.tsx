'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useSessionId } from '@/hooks/useSessionId';

interface NightSummaryProps {
  entityId: string;
  entityType: 'venue' | 'event';
  entityName: string;
}

interface MyStats {
  songsAdded: number;
  votesGiven: number;
  topSong: { title: string; artist: string; votes: number; albumArt?: string } | null;
}

export function NightSummary({ entityId, entityType, entityName }: NightSummaryProps) {
  const [stats, setStats] = useState<MyStats | null>(null);
  const [show, setShow] = useState(false);
  const sessionId = useSessionId();

  const loadStats = async () => {
    if (!entityId || !sessionId) return;
    try {
      const endpoint = entityType === 'event'
        ? `/events/${entityId}/my-stats?sessionId=${sessionId}`
        : `/queue/${entityId}/my-stats?sessionId=${sessionId}`;
      const data = await apiFetch<MyStats>(endpoint);
      if (data.songsAdded > 0 || data.votesGiven > 0) {
        setStats(data);
        setShow(true);
      }
    } catch {}
  };

  if (!show || !stats) {
    return (
      <button
        onClick={loadStats}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 16,
        }}
      >
        📊 Ver mi resumen de la noche
      </button>
    );
  }

  const shareText = `Mi noche en ${entityName}: agregué ${stats.songsAdded} canciones, voté ${stats.votesGiven} veces${stats.topSong ? `, mi hit fue "${stats.topSong.title}" con ${stats.topSong.votes} votos` : ''} 🎵 nextup.app`;

  return (
    <div style={{
      padding: 20,
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, var(--bg-surface-2), var(--bg-card))',
      border: '1px solid var(--border)',
      textAlign: 'center',
      marginTop: 16,
      animation: 'fadeInUp var(--transition-slow) ease both',
    }}>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
        Tu noche en números
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text)' }}>{stats.songsAdded}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>canciones</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text)' }}>{stats.votesGiven}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>votos</div>
        </div>
      </div>
      {stats.topSong && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>Tu hit de la noche</p>
          <p style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{stats.topSong.title}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{stats.topSong.artist} · {stats.topSong.votes} votos</p>
        </div>
      )}
      <button
        onClick={() => {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }}
        style={{
          padding: '10px 20px',
          borderRadius: 'var(--radius-full)',
          background: '#25D366',
          color: '#fff',
          fontWeight: 700,
          fontSize: 'var(--text-sm)',
          border: 'none',
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        Compartir por WhatsApp
      </button>
    </div>
  );
}
