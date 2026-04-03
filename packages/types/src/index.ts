// User (public — never includes passwordHash)
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date | string;
}

// Venue (admin view — includes tokens for status checks)
export interface Venue {
  id: string;
  name: string;
  slug: string;
  adminPin?: string | null;
  spotifyAccessToken?: string | null;
  spotifyRefreshToken?: string | null;
  tokenExpiresAt?: Date | string | null;
  spotifyClientId?: string | null;
  spotifyClientSecret?: string | null;
  backgroundImage?: string | null;
  active: boolean;
  userId: string;
  createdAt: Date | string;
}

// Venue public (client view — no sensitive fields)
export interface VenuePublic {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface QueuedSong {
  id: string;
  venueId: string;
  spotifyUri: string;
  spotifyId: string;
  title: string;
  artist: string;
  albumArt?: string | null;
  votes: number;
  played: boolean;
  createdAt: Date | string;
}

export interface Vote {
  id: string;
  songId: string;
  sessionId: string;
  createdAt: Date | string;
}

export interface TrackResult {
  spotifyId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt: string;
  durationMs: number;
}

export interface CurrentTrack {
  trackId: string;
  name: string;
  artist: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
}

export interface SpotifyStatus {
  connected: boolean;
  tokenValid: boolean;
}

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// WebSocket payloads
export interface QueueUpdatePayload {
  queue: QueuedSong[];
}

export interface VotePayload {
  venueId: string;
  songId: string;
  sessionId: string;
}

export interface JoinVenuePayload {
  venueId: string;
}

// Backward compat aliases
export type Bar = Venue;
export type JoinBarPayload = JoinVenuePayload;
