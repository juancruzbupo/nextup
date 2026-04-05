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
import { Coachmark } from '@/components/Coachmark';
import { ShareButton } from '@/components/ShareButton';
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

  // Poll for Spotify connection status if not yet connected
  useEffect(() => {
    if (!event || event.spotifyConnected) return;
    const interval = setInterval(async () => {
      try {
        const updated = await apiFetch<EventPublic>(`/events/code/${accessCode}`);
        if (updated.spotifyConnected) {
          setEvent(updated);
          clearInterval(interval);
        }
      } catch {}
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [event, accessCode]);

  const { queue, vote, isConnected, votedSongs, nowPlaying, eventEnded, listenerCount } = useEventQueue(event?.id || '');
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
        <div className={styles.error} role="alert">
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1>Evento finalizado</h1>
          <p>Este evento ha terminado. ¡Gracias por participar!</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/join" style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: 700, fontSize: 'var(--text-base)', display: 'inline-block' }}>
              Unirse a otro evento
            </Link>
            <Link href="/" style={{ padding: '12px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 'var(--text-base)', display: 'inline-block' }}>
              Volver al inicio
            </Link>
          </div>
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
          {isConnected ? `En vivo${listenerCount > 1 ? ` · ${listenerCount} personas` : ''}` : 'Offline'}
        </div>
      </header>

      {event.startsAt && event.endsAt && (
        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8, position: 'relative', zIndex: 1 }}>
          {new Date(event.startsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {new Date(event.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <ShareButton venueName={event.name} currentTrack={nowPlaying} />
      </div>

      <section className={styles.section}>
        <NowPlaying venueId={event.id} externalTrack={nowPlaying} isEvent dedication={nowPlaying ? (queue.find(s => s.spotifyId === nowPlaying.trackId) as any)?.dedication : null} votedSongs={votedSongs} queue={queue} />
      </section>

      <section className={styles.section} data-tour="search">
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h2 className={styles.sectionTitle}>Buscar y agregar</h2>
        </div>
        {event.spotifyConnected ? (
          <SearchBar eventId={event.id} queuedSpotifyIds={new Set(queue.map(s => s.spotifyId))} />
        ) : (
          <div style={{ padding: 20, textAlign: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 4 }}>
              La búsqueda estará disponible pronto
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              El organizador todavía no conectó la música. Mientras tanto, podés votar las canciones que ya están en la cola.
            </p>
          </div>
        )}
      </section>

      <section className={styles.section} data-tour="queue">
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h2 className={styles.sectionTitle}>En cola</h2>
          {queue.length > 0 && <span className={styles.queueCount}>{queue.length}</span>}
          {queue.length > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: 8 }}>Se ordena por votos</span>}
        </div>
        <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} />
      </section>

      <Coachmark
        id={`event-${accessCode}`}
        steps={[
          { target: '[data-tour="search"]', text: 'Buscá una canción y tocá + para agregarla' },
          { target: '[data-tour="queue"]', text: 'Votá las que te gustan. La más votada suena después.' },
        ]}
      />
    </main>
  );
}
