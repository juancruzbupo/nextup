export interface Bar {
  id: string;
  name: string;
  slug: string;
  adminPin?: string | null;
  spotifyAccessToken?: string | null;
  spotifyRefreshToken?: string | null;
  tokenExpiresAt?: Date | string | null;
  active: boolean;
  createdAt: Date | string;
}

export interface QueuedSong {
  id: string;
  barId: string;
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

export interface QueueUpdatePayload {
  queue: QueuedSong[];
}

export interface VotePayload {
  barId: string;
  songId: string;
  sessionId: string;
}

export interface JoinBarPayload {
  barId: string;
}
