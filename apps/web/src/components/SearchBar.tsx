'use client';

import { useState, useEffect, useRef } from 'react';
import { useSessionId } from '@/hooks/useSessionId';
import { apiFetch } from '@/lib/api';
import { useToast } from './Toast';
import type { TrackResult } from '@nextup/types';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  venueId?: string;
  eventId?: string;
}

export function SearchBar({ venueId, eventId }: SearchBarProps) {
  const entityId = venueId || eventId || '';
  const searchEndpoint = eventId ? `/events/${eventId}/queue/search` : `/queue/${entityId}/search`;
  const addEndpoint = eventId ? `/events/${eventId}/queue/add` : `/queue/${entityId}/add`;
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const sessionId = useSessionId();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const data = await apiFetch<TrackResult[]>(
          `${searchEndpoint}?q=${encodeURIComponent(query.trim())}`,
          { signal: abortRef.current.signal },
        );
        setResults(data);
        setSearched(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
      debounceRef.current = null;
      abortRef.current = null;
    };
  }, [query, searchEndpoint]);

  const addSong = async (track: TrackResult) => {
    if (addingId) return;
    try {
      setAddingId(track.spotifyId);
      const result = await apiFetch<{ alreadyExists?: boolean; cooldown?: boolean }>(`${addEndpoint}`, {
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

      if (result.cooldown) {
        toast('Esta canción se reprodujo hace poco. Probá en unos minutos.', 'info');
        setAddingId(null);
        return;
      }

      if ((result as any).limitReached) {
        toast(`Llegaste al máximo de canciones permitidas`, 'info');
        setAddingId(null);
        return;
      }

      if (result.alreadyExists) {
        toast('Esta canción ya está en la cola', 'info');
        setAddingId(null);
        return;
      }

      toast(`${track.title} agregada a la cola`, 'success');
      setTimeout(() => {
        setAddingId(null);
        setQuery('');
        setResults([]);
        setSearched(false);
      }, 500);
    } catch {
      toast('No se pudo agregar la canción', 'error');
      setAddingId(null);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar canción o artista..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
          aria-label="Buscar canción o artista"
        />
        <button
          onClick={clearSearch}
          className={styles.clearBtn}
          aria-label="Limpiar búsqueda"
          style={query ? undefined : { visibility: 'hidden' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className={styles.results}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonArt} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonArtist} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className={styles.results}>
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            No se encontraron canciones
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className={styles.results}>
          {results.map((track, index) => (
            <div
              key={track.spotifyId}
              className={`${styles.result} ${addingId === track.spotifyId ? styles.added : ''}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {track.albumArt ? (
                <img src={track.albumArt} alt="" className={styles.albumArt} />
              ) : (
                <div className={styles.albumArtPlaceholder}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
              <div className={styles.info}>
                <div className={styles.title}>{track.title}</div>
                <div className={styles.artist}>{track.artist}</div>
              </div>
              <button
                onClick={() => addSong(track)}
                className={`${styles.addBtn} ${addingId === track.spotifyId ? styles.addedBtn : ''}`}
                disabled={!!addingId}
                aria-label={addingId === track.spotifyId ? 'Canción agregada' : `Agregar ${track.title}`}
              >
                {addingId === track.spotifyId ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
