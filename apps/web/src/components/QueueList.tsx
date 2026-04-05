'use client';

import { useState, useEffect, useRef, memo } from 'react';
import type { QueuedSong, EventSong } from '@nextup/types';
import styles from './QueueList.module.css';

type SongItem = QueuedSong | EventSong;

interface QueueListProps {
  queue: SongItem[];
  onVote: (songId: string) => void;
  votedSongs: Set<string>;
  showDelete?: boolean;
  onDelete?: (songId: string) => void;
  onPlay?: (songId: string) => void;
}

export const QueueList = memo(function QueueList({ queue, onVote, votedSongs, showDelete, onDelete, onPlay }: QueueListProps) {
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Click outside to cancel delete confirmation
  useEffect(() => {
    if (!confirmDelete) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setConfirmDelete(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDelete]);

  const handleVote = (songId: string) => {
    onVote(songId);
    setJustVoted(songId);
    // Haptic feedback on mobile — double-tap pattern for votes
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]);
    }
    setTimeout(() => setJustVoted(null), 500);
  };

  if (queue.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>La cola está vacía</p>
        <p className={styles.emptySub}>Buscá una canción y sé el primero en agregar algo</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className={styles.list} role="list" aria-label="Cola de canciones">
      <div className="sr-only" aria-live="polite">{queue.length} canciones en cola</div>
      {queue.map((song, index) => {
        const isNext = index === 0;
        const hasVoted = votedSongs.has(song.id);
        const isBouncing = justVoted === song.id;

        return (
          <div
            key={song.id}
            className={`${styles.item} ${isNext ? styles.next : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={styles.position}>
              {isNext ? (
                <div className={styles.nextIndicator}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </div>
              ) : (
                <span className={styles.posNumber}>{index + 1}</span>
              )}
            </div>

            {song.albumArt ? (
              <img src={song.albumArt} alt={`${song.title} — ${song.artist}`} className={styles.albumArt} />
            ) : (
              <div className={styles.albumArtPlaceholder}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}

            <div className={styles.info}>
              <div className={styles.titleRow}>
                {isNext && votedSongs.has(song.id) && <span className={styles.badgeMine}>Tu canción!</span>}
                {isNext && !votedSongs.has(song.id) && <span className={styles.badge}>Próxima</span>}
                <span className={styles.title}>{song.title}</span>
              </div>
              <div className={styles.artist}>{song.artist}{!isNext && hasVoted && <span style={{ color: 'var(--accent)', marginLeft: 4 }}> · Votaste · suena en ~{index} canciones</span>}</div>
              {((song as any).groupName || (song as any).dedication) && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-text)', fontStyle: 'italic', marginTop: 2 }}>
                  {(song as any).groupName && <span>👥 {(song as any).groupName}</span>}
                  {(song as any).groupName && (song as any).dedication && ' · '}
                  {(song as any).dedication && <span>💌 {(song as any).dedication}</span>}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <div style={{ position: 'relative' }}>
                {isBouncing && (
                  <span style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    color: 'var(--accent)', fontWeight: 800, fontSize: 'var(--text-sm)',
                    animation: 'floatUp 800ms ease-out forwards', pointerEvents: 'none', zIndex: 10,
                  }}>+1</span>
                )}
              <button
                onClick={() => handleVote(song.id)}
                className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''} ${isBouncing ? styles.voteBounce : ''}`}
                disabled={hasVoted}
                aria-label={`Votar ${song.title}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5m-7 7 7-7 7 7" />
                </svg>
                <span className={styles.voteCount}>{song.votes}</span>
              </button>
              </div>

              {onPlay && (
                <button
                  onClick={() => onPlay(song.id)}
                  className={styles.playBtn}
                  aria-label={`Reproducir ${song.title}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </button>
              )}
              {showDelete && onDelete && (
                confirmDelete === song.id ? (
                  <button
                    onClick={() => { onDelete(song.id); setConfirmDelete(null); }}
                    className={styles.deleteBtn}
                    style={{ color: 'var(--danger)', borderColor: 'rgba(255,71,87,0.3)', background: 'var(--danger-subtle)' }}
                    aria-label={`Confirmar eliminar ${song.title}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(song.id)}
                    className={styles.deleteBtn}
                    aria-label={`Eliminar ${song.title}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
