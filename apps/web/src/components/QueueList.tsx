'use client';

import type { QueuedSong } from '@barjukebox/types';
import styles from './QueueList.module.css';

interface QueueListProps {
  queue: QueuedSong[];
  onVote: (songId: string) => void;
  votedSongs: Set<string>;
  showDelete?: boolean;
  onDelete?: (songId: string) => void;
}

export function QueueList({ queue, onVote, votedSongs, showDelete, onDelete }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyIcon}>🎶</p>
        <p>¡Sé el primero en poner algo!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {queue.map((song, index) => (
        <div
          key={song.id}
          className={`${styles.item} ${index === 0 ? styles.next : ''}`}
        >
          {song.albumArt && (
            <img src={song.albumArt} alt="" className={styles.albumArt} />
          )}
          <div className={styles.info}>
            <div className={styles.title}>
              {index === 0 && <span className={styles.badge}>Próxima</span>}
              {song.title}
            </div>
            <div className={styles.artist}>{song.artist}</div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={() => onVote(song.id)}
              className={`${styles.voteBtn} ${votedSongs.has(song.id) ? styles.voted : ''}`}
              disabled={votedSongs.has(song.id)}
            >
              <span className={styles.arrow}>↑</span>
              <span>{song.votes}</span>
            </button>
            {showDelete && onDelete && (
              <button onClick={() => onDelete(song.id)} className={styles.deleteBtn}>
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
