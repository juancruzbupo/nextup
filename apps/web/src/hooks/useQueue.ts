'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionId } from './useSessionId';
import type { QueuedSong, EventSong, CurrentTrack } from '@nextup/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type SongItem = QueuedSong | EventSong;

function votedKey(entityId: string, entityType: string) {
  return `nextup-${entityType}-voted-${entityId}`;
}

function loadVotedSongs(entityId: string, entityType: string): Set<string> {
  if (!entityId) return new Set();
  try {
    const stored = localStorage.getItem(votedKey(entityId, entityType));
    if (stored) return new Set(JSON.parse(stored));
  } catch {}
  return new Set();
}

function saveVotedSongs(entityId: string, entityType: string, set: Set<string>) {
  if (!entityId) return;
  try {
    localStorage.setItem(votedKey(entityId, entityType), JSON.stringify([...set]));
  } catch {}
}

interface UseQueueOptions {
  entityId: string;
  entityType: 'venue' | 'event';
}

export function useQueue({ entityId, entityType }: UseQueueOptions) {
  const namespace = entityType === 'event' ? '/events' : '';
  const joinMsg = entityType === 'event' ? 'join-event' : 'join-venue';
  const voteMsg = entityType === 'event' ? 'vote-event' : 'vote';
  const entityKey = entityType === 'event' ? 'eventId' : 'venueId';

  const [queue, setQueue] = useState<SongItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<CurrentTrack | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(() => loadVotedSongs(entityId, entityType));
  const [eventEnded, setEventEnded] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null);
  const [trendingSong, setTrendingSong] = useState<{ title: string; votes: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const votingRef = useRef(false);
  const sessionId = useSessionId();

  useEffect(() => {
    if (!entityId) return;

    const socket = io(`${API_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 60000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit(joinMsg, { [entityKey]: entityId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('queue-updated', (data: { queue: SongItem[] }) => {
      setQueue(data.queue);
    });

    // Lightweight vote delta — update single song's votes without full queue refresh
    socket.on('vote-update', (data: { songId: string; votes: number }) => {
      setQueue((prev) =>
        [...prev]
          .map((s) => (s.id === data.songId ? { ...s, votes: data.votes } : s))
          .sort((a, b) => {
            if (b.votes !== a.votes) return b.votes - a.votes;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }),
      );
    });

    socket.on('now-playing-changed', (data: { track: CurrentTrack }) => {
      setNowPlaying(data.track);
    });

    socket.on('listener-count', (data: { count: number }) => {
      setListenerCount(data.count);
    });

    socket.on('reaction', (data: { emoji: string }) => {
      setIncomingReaction(data.emoji);
      setTimeout(() => setIncomingReaction(null), 100);
    });

    socket.on('trending-song', (data: { title: string; votes: number }) => {
      setTrendingSong(data);
      setTimeout(() => setTrendingSong(null), 10000); // Auto-dismiss after 10s
    });

    socket.on('vote-error', () => {
      socket.emit(joinMsg, { [entityKey]: entityId });
    });

    if (entityType === 'event') {
      socket.on('event-ended', () => setEventEnded(true));
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [entityId]);

  const vote = useCallback(
    (songId: string) => {
      if (!sessionId || votedSongs.has(songId) || votingRef.current || !socketRef.current?.connected) return;

      votingRef.current = true;
      setTimeout(() => { votingRef.current = false; }, 500);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 50, 20]);
      }

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
      saveVotedSongs(entityId, entityType, newVoted);

      socketRef.current.emit(voteMsg, { [entityKey]: entityId, songId, sessionId });
    },
    [entityId, entityType, entityKey, voteMsg, sessionId, votedSongs],
  );

  const sendReaction = useCallback((emoji: string) => {
    if (!socketRef.current?.connected) return;
    const reactionMsg = entityType === 'event' ? 'reaction-event' : 'reaction';
    socketRef.current.emit(reactionMsg, { [entityKey]: entityId, emoji });
  }, [entityId, entityType, entityKey]);

  return { queue, vote, isConnected, votedSongs, nowPlaying, eventEnded, listenerCount, sendReaction, incomingReaction, trendingSong };
}
