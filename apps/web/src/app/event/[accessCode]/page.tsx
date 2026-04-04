'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useEventQueue } from '@/hooks/useEventQueue';
import { useAlbumColor } from '@/hooks/useAlbumColor';
import { NowPlaying } from '@/components/NowPlaying';
import { SearchBar } from '@/components/SearchBar';
import { QueueList } from '@/components/QueueList';
import type { EventPublic } from '@nextup/types';
import styles from '../../bar/[slug]/page.module.css';

export default function EventPage() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [event, setEvent] = useState<EventPublic | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<EventPublic>(`/events/code/${accessCode}`)
      .then(setEvent)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [accessCode]);

  const { queue, vote, isConnected, votedSongs, nowPlaying, eventEnded } = useEventQueue(event?.id || '');
  const albumColor = useAlbumColor(nowPlaying?.albumArt);
  const [r, g, b] = albumColor;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonNowPlaying} />
          <div className={styles.skeletonSearch} />
          <div className={styles.skeletonItem} />
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          </div>
          <h1>Evento no encontrado</h1>
          <p>El evento no existe o ya finalizó.</p>
          <Link href="/join" style={{ marginTop: 16, padding: '12px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.9rem', display: 'inline-block' }}>
            Probar otro código
          </Link>
        </div>
      </main>
    );
  }

  if (eventEnded) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1>Evento finalizado</h1>
          <p>Este evento ha terminado. ¡Gracias por participar!</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div
        className={styles.ambientGlow}
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${r},${g},${b},0.12), transparent 70%)`, transition: 'background 1.5s ease' }}
      />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <h1 className={styles.barName}>{event.name}</h1>
            <span className={styles.barSub}>Nextup</span>
          </div>
        </div>
        <div className={`${styles.statusBadge} ${isConnected ? styles.online : ''}`}>
          <span className={styles.statusDot} />
          {isConnected ? 'En vivo' : 'Offline'}
        </div>
      </header>

      <section className={styles.section}>
        <NowPlaying venueId={event.id} externalTrack={nowPlaying} />
      </section>

      {event.spotifyConnected && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h2 className={styles.sectionTitle}>Buscar y agregar</h2>
          </div>
          <SearchBar eventId={event.id} />
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h2 className={styles.sectionTitle}>En cola</h2>
          {queue.length > 0 && <span className={styles.queueCount}>{queue.length}</span>}
        </div>
        <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} />
      </section>
    </main>
  );
}
