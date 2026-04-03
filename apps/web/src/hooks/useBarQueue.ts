'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionId } from './useSessionId';
import type { QueuedSong } from '@barjukebox/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useBarQueue(barId: string) {
  const [queue, setQueue] = useState<QueuedSong[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const sessionId = useSessionId();

  useEffect(() => {
    if (!barId) return;

    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-bar', { barId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('queue-updated', (data: { queue: QueuedSong[] }) => {
      setQueue(data.queue);
    });

    socket.on('vote-error', (data: { message: string }) => {
      console.warn(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [barId]);

  const vote = useCallback(
    (songId: string) => {
      if (!sessionId || votedSongs.has(songId)) return;

      // Optimistic update
      setQueue((prev) =>
        [...prev]
          .map((s) => (s.id === songId ? { ...s, votes: s.votes + 1 } : s))
          .sort((a, b) => b.votes - a.votes),
      );
      setVotedSongs((prev) => new Set(prev).add(songId));

      socketRef.current?.emit('vote', { barId, songId, sessionId });
    },
    [barId, sessionId, votedSongs],
  );

  return { queue, vote, isConnected, votedSongs };
}
