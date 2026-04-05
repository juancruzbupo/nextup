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
  dedication?: string | null;
  groupName?: string | null;
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
  popularity?: number;
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

export interface VenueTrack {
  id: string;
  venueId: string;
  spotifyId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumArt?: string | null;
  totalRequests: number;
}

// Event types
export interface Event {
  id: string;
  name: string;
  slug: string;
  accessCode: string;
  adminPin?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  active: boolean;
  maxSongsPerUser: number;
  allowExplicit: boolean;
  ownerId: string;
  createdAt: Date | string;
}

export interface EventPublic {
  id: string;
  name: string;
  accessCode: string;
  active: boolean;
  startsAt: Date | string;
  endsAt: Date | string;
  maxSongsPerUser: number;
  spotifyConnected: boolean;
}

export interface EventSong {
  id: string;
  eventId: string;
  spotifyUri: string;
  spotifyId: string;
  title: string;
  artist: string;
  albumArt?: string | null;
  dedication?: string | null;
  groupName?: string | null;
  votes: number;
  played: boolean;
  createdAt: Date | string;
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

// Event WebSocket payloads
export interface JoinEventPayload {
  eventId: string;
}

export interface VoteEventPayload {
  eventId: string;
  songId: string;
  sessionId: string;
}

// Backward compat aliases
export type Bar = Venue;
export type JoinBarPayload = JoinVenuePayload;
