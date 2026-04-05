'use client';

import { useEffect, useState } from 'react';
import { useSessionId } from '@/hooks/useSessionId';
import { apiFetch } from '@/lib/api';
import { useToast } from './Toast';
import type { VenueTrack, QueuedSong, EventSong } from '@nextup/types';
import styles from './TopTracks.module.css';

interface TopTracksProps {
  venueId: string;
  queue: (QueuedSong | EventSong)[];
}

export function TopTracks({ venueId, queue }: TopTracksProps) {
  const [tracks, setTracks] = useState<VenueTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const sessionId = useSessionId();
  const toast = useToast();

  useEffect(() => {
    if (!venueId) return;
    apiFetch<VenueTrack[]>(`/queue/${venueId}/top-tracks`)
      .then(setTracks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId]);

  const queuedSpotifyIds = new Set(queue.map((s) => s.spotifyId));

  const addToQueue = async (track: VenueTrack) => {
    if (addingId || queuedSpotifyIds.has(track.spotifyId)) return;
    try {
      setAddingId(track.spotifyId);
      await apiFetch(`/queue/${venueId}/add`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId },
        body: JSON.stringify({
          spotifyId: track.spotifyId,
          spotifyUri: track.spotifyUri,
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt,
        }),
      });
      toast(`${track.title} agregada a la cola`, 'success');
      setTimeout(() => setAddingId(null), 500);
    } catch {
      toast('No se pudo agregar la canción', 'error');
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.list}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.item} style={{ opacity: 0.5 }}>
            <span className={styles.rank}>#{i}</span>
            <div className={styles.artPlaceholder}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className={styles.info}>
              <div className={styles.title} style={{ width: '60%', height: 14, background: 'var(--bg-elevated)', borderRadius: 4 }} />
              <div className={styles.meta} style={{ width: '40%', height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (tracks.length === 0) return null;

  return (
    <div className={styles.list} role="list" aria-label="Canciones más pedidas">
      {tracks.map((track, index) => {
        const inQueue = queuedSpotifyIds.has(track.spotifyId);
        const isAdding = addingId === track.spotifyId;

        return (
          <div key={track.id} className={styles.item} style={{ animationDelay: `${index * 40}ms` }}>
            <span className={styles.rank}>#{index + 1}</span>

            {track.albumArt ? (
              <img src={track.albumArt} alt="" className={styles.art} />
            ) : (
              <div className={styles.artPlaceholder}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}

            <div className={styles.info}>
              <div className={styles.title}>{track.title}</div>
              <div className={styles.meta}>
                {track.artist}
                <span className={styles.requests}>{track.totalRequests} pedidas</span>
              </div>
            </div>

            <button
              onClick={() => addToQueue(track)}
              className={`${styles.addBtn} ${inQueue || isAdding ? styles.added : ''}`}
              disabled={inQueue || !!addingId}
              aria-label={inQueue ? 'Ya en cola' : `Agregar ${track.title}`}
            >
              {inQueue || isAdding ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
