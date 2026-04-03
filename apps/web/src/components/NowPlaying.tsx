'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { CurrentTrack } from '@barjukebox/types';
import styles from './NowPlaying.module.css';

export function NowPlaying({ barId }: { barId: string }) {
  const [track, setTrack] = useState<CurrentTrack | null>(null);

  useEffect(() => {
    if (!barId) return;

    const fetchNowPlaying = async () => {
      try {
        const data = await apiFetch<CurrentTrack | null>(`/queue/${barId}/now-playing`);
        setTrack(data);
      } catch {
        setTrack(null);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, [barId]);

  if (!track) {
    return (
      <div className={styles.container}>
        <div className={styles.idle}>
          <span className={styles.idleIcon}>🔇</span>
          <span>No hay nada sonando</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.label}>Sonando ahora</div>
      <div className={styles.track}>
        {track.albumArt && (
          <img src={track.albumArt} alt="" className={styles.albumArt} />
        )}
        <div className={styles.info}>
          <div className={styles.name}>{track.name}</div>
          <div className={styles.artist}>{track.artist}</div>
        </div>
      </div>
    </div>
  );
}
