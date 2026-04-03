'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import type { CurrentTrack } from '@nextup/types';
import styles from './NowPlaying.module.css';

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface NowPlayingProps {
  venueId: string;
  onSkip?: () => void;
  /** Externally provided track from WebSocket (avoids duplicate connections) */
  externalTrack?: CurrentTrack | null;
}

export function NowPlaying({ venueId, onSkip, externalTrack }: NowPlayingProps) {
  const [track, setTrack] = useState<CurrentTrack | null>(null);
  const [progress, setProgress] = useState(0);
  const lastFetchRef = useRef(0);
  const trackIdRef = useRef<string | null>(null);

  // Accept external track updates from WebSocket (no duplicate connection)
  useEffect(() => {
    if (externalTrack === undefined) return; // prop not provided
    if (externalTrack) {
      if (externalTrack.trackId !== trackIdRef.current) {
        setProgress(externalTrack.progressMs);
        trackIdRef.current = externalTrack.trackId;
      }
      lastFetchRef.current = Date.now();
    }
    setTrack(externalTrack);
  }, [externalTrack]);

  // HTTP poll as fallback (every 10s)
  useEffect(() => {
    if (!venueId) return;

    const fetchNowPlaying = async () => {
      try {
        const data = await apiFetch<CurrentTrack | null>(`/queue/${venueId}/now-playing`);
        if (data) {
          if (data.trackId !== trackIdRef.current) {
            setProgress(data.progressMs);
            trackIdRef.current = data.trackId;
          } else {
            const drift = Math.abs(progress - data.progressMs);
            if (drift > 3000) setProgress(data.progressMs);
          }
          lastFetchRef.current = Date.now();
        }
        setTrack(data);
      } catch {
        // Don't clear track on network error — keep showing last known
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, [venueId]);

  // Client-side progress interpolation (1s tick)
  useEffect(() => {
    if (!track) return;

    const tick = setInterval(() => {
      const elapsed = Date.now() - lastFetchRef.current;
      const interpolated = track.progressMs + elapsed;
      setProgress(Math.min(interpolated, track.durationMs));
    }, 1000);

    return () => clearInterval(tick);
  }, [track]);

  if (!track) {
    return (
      <div className={styles.container}>
        <div className={styles.idle}>
          <div className={styles.idleIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className={styles.idleText}>
            <span className={styles.idleTitle}>Sin reproducir</span>
            <span className={styles.idleSub}>Esperando que suene algo...</span>
          </div>
        </div>
      </div>
    );
  }

  const pct = track.durationMs > 0 ? (progress / track.durationMs) * 100 : 0;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <div className={styles.trackWrapper}>
      <div className={styles.track}>
        <div className={styles.artWrapper}>
          {track.albumArt ? (
            <img src={track.albumArt} alt="" className={styles.albumArt} />
          ) : (
            <div className={styles.albumArtPlaceholder}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className={styles.artGlow} />
        </div>
        <div className={styles.info}>
          <div className={styles.labelRow}>
            <div className={styles.equalizer}>
              <span className={styles.eqBar} />
              <span className={styles.eqBar} />
              <span className={styles.eqBar} />
            </div>
            <span className={styles.label}>Sonando ahora</span>
          </div>
          <div className={styles.name}>{track.name}</div>
          <div className={styles.artist}>{track.artist}</div>
          <div className={styles.progressWrapper}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.progressTime}>
              <span>{formatTime(progress)}</span>
              <span>{formatTime(track.durationMs)}</span>
            </div>
          </div>
        </div>
        {onSkip && (
          <button onClick={onSkip} className={styles.skipBtn} title="Saltar canción" aria-label="Saltar canción">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 5v14l11-7L5 5zm13 0v14h2V5h-2z" />
            </svg>
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
