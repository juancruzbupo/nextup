'use client';

import { useState, useEffect, useRef } from 'react';
import { useSessionId } from '@/hooks/useSessionId';
import { apiFetch, API_URL } from '@/lib/api';
import type { TrackResult } from '@barjukebox/types';
import styles from './SearchBar.module.css';

export function SearchBar({ barId }: { barId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionId = useSessionId();
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<TrackResult[]>(
          `/queue/${barId}/search?q=${encodeURIComponent(query)}`,
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, barId]);

  const addSong = async (track: TrackResult) => {
    try {
      await fetch(`${API_URL}/queue/${barId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          spotifyId: track.spotifyId,
          spotifyUri: track.spotifyUri,
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt,
        }),
      });
      setQuery('');
      setResults([]);
    } catch (err) {
      console.error('Failed to add song', err);
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Buscar canción..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      {loading && <div className={styles.loading}>Buscando...</div>}
      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((track) => (
            <div key={track.spotifyId} className={styles.result}>
              {track.albumArt && (
                <img src={track.albumArt} alt="" className={styles.albumArt} />
              )}
              <div className={styles.info}>
                <div className={styles.title}>{track.title}</div>
                <div className={styles.artist}>{track.artist}</div>
              </div>
              <button onClick={() => addSong(track)} className={styles.addBtn}>
                +
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
