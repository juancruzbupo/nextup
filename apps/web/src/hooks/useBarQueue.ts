'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionId } from './useSessionId';
import type { QueuedSong, CurrentTrack } from '@nextup/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function votedKey(venueId: string) {
  return `nextup-voted-${venueId}`;
}

function loadVotedSongs(venueId: string): Set<string> {
  if (!venueId) return new Set();
  try {
    const stored = localStorage.getItem(votedKey(venueId));
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

function saveVotedSongs(venueId: string, set: Set<string>) {
  if (!venueId) return;
  try {
    localStorage.setItem(votedKey(venueId), JSON.stringify([...set]));
  } catch {}
}

export function useBarQueue(venueId: string) {
  const [queue, setQueue] = useState<QueuedSong[]>([]);
  const [nowPlaying, setNowPlaying] = useState<CurrentTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(() => loadVotedSongs(venueId));
  const socketRef = useRef<Socket | null>(null);
  const sessionId = useSessionId();

  useEffect(() => {
    if (!venueId) return;

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-venue', { venueId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('queue-updated', (data: { queue: QueuedSong[] }) => {
      setQueue(data.queue);
    });

    socket.on('now-playing-changed', (data: { track: CurrentTrack }) => {
      setNowPlaying(data.track);
    });

    socket.on('vote-error', () => {
      socket.emit('join-venue', { venueId });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [venueId]);

  const vote = useCallback(
    (songId: string) => {
      if (!sessionId || votedSongs.has(songId)) return;

      // Optimistic update
      setQueue((prev) =>
        [...prev]
          .map((s) => (s.id === songId ? { ...s, votes: s.votes + 1 } : s))
          .sort((a, b) => b.votes - a.votes),
      );

      const newVoted = new Set(votedSongs).add(songId);
      setVotedSongs(newVoted);
      saveVotedSongs(venueId, newVoted);

      socketRef.current?.emit('vote', { venueId, songId, sessionId });
    },
    [venueId, sessionId, votedSongs],
  );

  return { queue, vote, isConnected, votedSongs, nowPlaying };
}
