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
  queuedSpotifyIds?: Set<string>;
}

export function SearchBar({ venueId, eventId, queuedSpotifyIds }: SearchBarProps) {
  const entityId = venueId || eventId || '';
  const searchEndpoint = eventId ? `/events/${eventId}/queue/search` : `/queue/${entityId}/search`;
  const addEndpoint = eventId ? `/events/${eventId}/queue/add` : `/queue/${entityId}/add`;
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [pendingTrack, setPendingTrack] = useState<TrackResult | null>(null);
  const [dedication, setDedication] = useState('');
  const [groupName, setGroupName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('nextup-group-name') || '';
  });
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

  const confirmAdd = (track: TrackResult) => {
    if (addingId) return;
    setPendingTrack(track);
    setDedication('');
  };

  const addSong = async (dedicationText?: string) => {
    const track = pendingTrack;
    if (!track || addingId) return;
    try {
      setAddingId(track.spotifyId);
      setPendingTrack(null);
      const result = await apiFetch<{ alreadyExists?: boolean; cooldown?: boolean; cooldownMinutes?: number; limitReached?: boolean; max?: number }>(`${addEndpoint}`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId },
        body: JSON.stringify({
          spotifyId: track.spotifyId,
          spotifyUri: track.spotifyUri,
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt,
          ...(dedicationText?.trim() ? { dedication: dedicationText.trim() } : {}),
          ...(groupName?.trim() ? { groupName: groupName.trim() } : {}),
        }),
      });

      if (result.cooldown) {
        const mins = result.cooldownMinutes || 30;
        toast(`Esta canción se reprodujo hace poco. Probá en ${mins} minuto${mins === 1 ? '' : 's'}.`, 'info');
        setAddingId(null);
        return;
      }

      if (result.limitReached) {
        const max = result.max || 3;
        toast(`Llegaste al máximo de ${max} canciones permitidas`, 'info');
        setAddingId(null);
        return;
      }

      if (result.alreadyExists) {
        toast('Esta canción ya está en la cola', 'info');
        setAddingId(null);
        return;
      }

      toast(`${track.title} agregada a la cola`, 'success');
      setCelebratingId(track.spotifyId);
      setTimeout(() => setCelebratingId(null), 600);
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
          tabIndex={query ? 0 : -1}
          aria-hidden={!query}
          style={query ? undefined : { opacity: 0, pointerEvents: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {loading ? 'Buscando canciones...' : searched && results.length === 0 ? 'No se encontraron canciones' : searched ? `${results.length} resultados encontrados` : ''}
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
          {results.map((track, index) => {
            const inQueue = queuedSpotifyIds?.has(track.spotifyId);
            const isAdding = addingId === track.spotifyId;
            return (
              <div
                key={track.spotifyId}
                className={`${styles.result} ${isAdding || inQueue ? styles.added : ''} ${celebratingId === track.spotifyId ? styles.celebrating : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt={`${track.title} — ${track.artist}`} className={styles.albumArt} />
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
                  <div className={styles.title}>
                    {track.title}
                    {(track.popularity ?? 0) >= 70 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginLeft: 6, fontWeight: 600 }}>Popular</span>}
                  </div>
                  <div className={styles.artist}>{track.artist}{inQueue && <span style={{ color: 'var(--accent)', marginLeft: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 2 }}><path d="M20 6 9 17l-5-5" /></svg>En cola</span>}</div>
                </div>
                <button
                  onClick={() => confirmAdd(track)}
                  className={`${styles.addBtn} ${isAdding ? styles.addedBtn : ''} ${inQueue ? styles.added : ''}`}
                  disabled={!!addingId || !!inQueue}
                  aria-label={inQueue ? 'Ya en cola' : isAdding ? 'Canción agregada' : `Agregar ${track.title}`}
                >
                  {isAdding || inQueue ? (
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
            );
          })}
        </div>
      )}

      {/* Dedication prompt */}
      {pendingTrack && (
        <div className={styles.results} style={{ padding: 16 }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: 4 }}>
            Agregar &quot;{pendingTrack.title}&quot;
          </p>
          <input
            type="text"
            placeholder="Tu mesa o grupo (opcional)"
            value={groupName}
            onChange={(e) => { setGroupName(e.target.value); localStorage.setItem('nextup-group-name', e.target.value); }}
            className={styles.input}
            style={{ marginBottom: 8, fontSize: 'var(--text-base)' }}
            maxLength={50}
            autoFocus
          />
          <input
            type="text"
            placeholder='Ej: "Para Sofi" o "Mesa 5 la rompe" (opcional)'
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            className={styles.input}
            style={{ marginBottom: 8, fontSize: 'var(--text-base)' }}
            maxLength={100}
            onKeyDown={(e) => { if (e.key === 'Enter') addSong(dedication); }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => addSong(dedication)}
              style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: 'var(--text-on-accent)', fontWeight: 700, border: 'none', cursor: 'pointer', minHeight: 44 }}
            >
              Agregar a la cola
            </button>
            <button
              onClick={() => setPendingTrack(null)}
              style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', minHeight: 44 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
