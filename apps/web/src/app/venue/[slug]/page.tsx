'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { useAlbumColor } from '@/hooks/useAlbumColor';
import { NowPlaying } from '@/components/NowPlaying';
import { SearchBar } from '@/components/SearchBar';
import { QueueList } from '@/components/QueueList';
import { TopTracks } from '@/components/TopTracks';
import type { Venue } from '@nextup/types';
import styles from '../../bar/[slug]/page.module.css';

export default function VenuePage() {
  const { slug } = useParams<{ slug: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Venue>(`/venues/${slug}`)
      .then(setVenue)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const { queue, vote, isConnected, votedSongs, nowPlaying } = useBarQueue(venue?.id || '');
  const albumColor = useAlbumColor(nowPlaying?.albumArt);

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonNowPlaying} />
          <div className={styles.skeletonSearch} />
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
        </div>
      </main>
    );
  }

  if (error || !venue) {
    return (
      <main className={styles.page}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          </div>
          <h1>Venue no encontrado</h1>
          <p>El venue que buscás no existe o fue desactivado.</p>
          <Link href="/" style={{ marginTop: 16, padding: '12px 24px', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: '0.9rem', display: 'inline-block' }}>
            Volver a inicio
          </Link>
        </div>
      </main>
    );
  }

  const [r, g, b] = albumColor;

  const ambientStyle: React.CSSProperties = {
    ...(venue.backgroundImage
      ? { backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.75), rgba(10,10,10,0.95)), url(${venue.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
      : {}),
  };

  return (
    <main className={styles.page} style={ambientStyle}>
      {/* Dynamic ambient glow from album art */}
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
            <h1 className={styles.barName}>{venue.name}</h1>
            <span className={styles.barSub}>Nextup</span>
          </div>
        </div>
        <div className={`${styles.statusBadge} ${isConnected ? styles.online : ''}`}>
          <span className={styles.statusDot} />
          {isConnected ? 'En vivo' : 'Offline'}
        </div>
      </header>

      <section className={styles.section}>
        <NowPlaying venueId={venue.id} externalTrack={nowPlaying} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h2 className={styles.sectionTitle}>Buscar y agregar</h2>
        </div>
        <SearchBar venueId={venue.id} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <h2 className={styles.sectionTitle}>En cola</h2>
          {queue.length > 0 && <span className={styles.queueCount}>{queue.length}</span>}
        </div>
        <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <h2 className={styles.sectionTitle}>Top pedidas</h2>
        </div>
        <TopTracks venueId={venue.id} queue={queue} />
      </section>
    </main>
  );
}
