'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionId } from './useSessionId';
import type { EventSong, CurrentTrack } from '@nextup/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function votedKey(eventId: string) {
  return `nextup-event-voted-${eventId}`;
}

function loadVotedSongs(eventId: string): Set<string> {
  if (!eventId) return new Set();
  try {
    const stored = localStorage.getItem(votedKey(eventId));
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

function saveVotedSongs(eventId: string, set: Set<string>) {
  if (!eventId) return;
  try {
    localStorage.setItem(votedKey(eventId), JSON.stringify([...set]));
  } catch {}
}

export function useEventQueue(eventId: string) {
  const [queue, setQueue] = useState<EventSong[]>([]);
  const [nowPlaying, setNowPlaying] = useState<CurrentTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(() => loadVotedSongs(eventId));
  const [eventEnded, setEventEnded] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const votingRef = useRef(false);
  const sessionId = useSessionId();

  useEffect(() => {
    if (!eventId) return;

    const socket = io(`${API_URL}/events`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-event', { eventId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('queue-updated', (data: { queue: EventSong[] }) => {
      setQueue(data.queue);
    });

    socket.on('now-playing-changed', (data: { track: CurrentTrack }) => {
      setNowPlaying(data.track);
    });

    socket.on('vote-error', () => {
      socket.emit('join-event', { eventId });
    });

    socket.on('event-ended', () => {
      setEventEnded(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId]);

  const vote = useCallback(
    (songId: string) => {
      if (!sessionId || votedSongs.has(songId) || votingRef.current || !socketRef.current?.connected) return;

      votingRef.current = true;
      setTimeout(() => { votingRef.current = false; }, 500);

      setQueue((prev) =>
        [...prev]
          .map((s) => (s.id === songId ? { ...s, votes: s.votes + 1 } : s))
          .sort((a, b) => {
            if (b.votes !== a.votes) return b.votes - a.votes;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }),
      );

      const newVoted = new Set(votedSongs).add(songId);
      setVotedSongs(newVoted);
      saveVotedSongs(eventId, newVoted);

      socketRef.current.emit('vote-event', { eventId, songId, sessionId });
    },
    [eventId, sessionId, votedSongs],
  );

  return { queue, vote, isConnected, votedSongs, nowPlaying, eventEnded };
}
