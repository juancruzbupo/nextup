'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { useAlbumColor } from '@/hooks/useAlbumColor';
import { FloatingReactions } from '@/components/FloatingReactions';
import type { Venue } from '@nextup/types';
import styles from './tv.module.css';

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function TVPage() {
  const { slug } = useParams<{ slug: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    apiFetch<Venue>(`/venues/${slug}`)
      .then(setVenue)
      .catch(() => {});
  }, [slug]);

  const { queue, isConnected, nowPlaying, listenerCount, incomingReaction } = useBarQueue(venue?.id || '');
  const albumColor = useAlbumColor(nowPlaying?.albumArt);
  const [r, g, b] = albumColor;

  // Client-side progress interpolation
  const [lastFetch, setLastFetch] = useState(Date.now());
  useEffect(() => {
    if (!nowPlaying) return;
    setProgress(nowPlaying.progressMs);
    setLastFetch(Date.now());
    const tick = setInterval(() => {
      const elapsed = Date.now() - lastFetch;
      setProgress(Math.min(nowPlaying.progressMs + elapsed, nowPlaying.durationMs));
    }, 1000);
    return () => clearInterval(tick);
  }, [nowPlaying]);

  // Load battle if enabled
  const [battle, setBattle] = useState<any>(null);
  useEffect(() => {
    if (!venue?.id || !(venue as any).enableDJBattle) return;
    const load = () => apiFetch(`/queue/${venue.id}/battle/active`).then(setBattle).catch(() => {});
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [venue]);

  if (!venue) {
    return <main className={styles.page}><div className={styles.idle}><p>Cargando...</p></div></main>;
  }

  const pct = nowPlaying && nowPlaying.durationMs > 0 ? (progress / nowPlaying.durationMs) * 100 : 0;
  const currentSong = nowPlaying ? queue.find(s => s.spotifyId === nowPlaying.trackId) : null;

  return (
    <main className={styles.page}>
      {/* Ambient glow from album color */}
      <div className={styles.ambientGlow} style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${r},${g},${b},0.15), transparent 70%)` }} />

      {/* Header */}
      <header className={styles.header} style={{ position: 'relative', zIndex: 1 }}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <h1 className={styles.venueName}>{venue.name}</h1>
        </div>
        <div className={`${styles.statusBadge} ${isConnected ? styles.online : ''}`}>
          <span className={styles.statusDot} />
          {isConnected ? `En vivo${listenerCount > 1 ? ` · ${listenerCount} personas` : ''}` : 'Offline'}
        </div>
      </header>

      {/* Now Playing */}
      {nowPlaying ? (
        <div className={styles.nowPlaying} style={{ position: 'relative', zIndex: 1 }}>
          {nowPlaying.albumArt ? (
            <img src={nowPlaying.albumArt} alt={`${nowPlaying.name} — ${nowPlaying.artist}`} className={styles.albumArt} />
          ) : (
            <div className={styles.albumArtPlaceholder}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className={styles.trackInfo}>
            <p className={styles.nowPlayingLabel}>Sonando ahora</p>
            <h2 className={styles.trackName}>{nowPlaying.name}</h2>
            <p className={styles.trackArtist}>{nowPlaying.artist}</p>
            {(currentSong as any)?.dedication && (
              <p className={styles.dedication}>💬 {(currentSong as any).dedication}</p>
            )}
            {(currentSong as any)?.groupName && (
              <p className={styles.dedication}>👥 {(currentSong as any).groupName}</p>
            )}
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressTime}>
              <span>{formatTime(progress)}</span>
              <span>{formatTime(nowPlaying.durationMs)}</span>
            </div>
          </div>

          {/* Floating reactions overlay */}
          {(venue as any)?.enableReactions && (
            <div style={{ position: 'absolute', right: 32, top: 0, bottom: 0, width: 200, pointerEvents: 'none' }}>
              <FloatingReactions onReact={() => {}} incomingReaction={incomingReaction} />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.nowPlaying} style={{ position: 'relative', zIndex: 1, justifyContent: 'center', minHeight: 200 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ marginBottom: 12, opacity: 0.5 }}>
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            <p style={{ fontSize: '1.2rem' }}>Esperando música...</p>
            <p style={{ fontSize: '0.9rem', marginTop: 4 }}>Escaneá el QR para agregar canciones</p>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className={styles.queueSection} style={{ position: 'relative', zIndex: 1 }}>
        {queue.length > 0 && (
          <>
            <h3 className={styles.sectionTitle}>Próximas · {queue.length} en cola</h3>
            <div className={styles.queueList}>
              {queue.slice(0, 6).map((song, i) => (
                <div key={song.id} className={styles.queueItem} style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={styles.queueRank}>{i === 0 ? '▶' : i + 1}</span>
                  {song.albumArt && <img src={song.albumArt} alt="" className={styles.queueArt} />}
                  <div className={styles.queueInfo}>
                    <div className={styles.queueTitle}>{song.title}</div>
                    <div className={styles.queueMeta}>
                      {song.artist}
                      {(song as any).groupName && ` · 👥 ${(song as any).groupName}`}
                      {(song as any).dedication && ` · 💬 ${(song as any).dedication}`}
                    </div>
                  </div>
                  <span className={styles.queueVotes}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7" /></svg>
                    {song.votes}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DJ Battle */}
      {battle && battle.status !== 'finished' && (
        <div className={styles.battleSection} style={{ position: 'relative', zIndex: 1 }}>
          <p className={styles.battleHeader}>🎤 DJ Battle</p>
          <div className={styles.battleScore}>
            <div className={styles.battleDj}>
              <p className={styles.battleDjName} style={{ color: 'var(--danger-text)' }}>{battle.djAName}</p>
              <p className={styles.battleDjScore}>{battle.rounds.reduce((s: number, r: any) => s + r.votesA, 0)}</p>
            </div>
            <span className={styles.battleVs}>VS</span>
            <div className={styles.battleDj}>
              <p className={styles.battleDjName} style={{ color: 'var(--accent)' }}>{battle.djBName}</p>
              <p className={styles.battleDjScore}>{battle.rounds.reduce((s: number, r: any) => s + r.votesB, 0)}</p>
            </div>
          </div>
          {battle.rounds.find((r: any) => r.status === 'voting') && (
            <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Ronda {battle.rounds.find((r: any) => r.status === 'voting').roundNum} — ¡Votá desde tu celular!
            </p>
          )}
        </div>
      )}
    </main>
  );
}
