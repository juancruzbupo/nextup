'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, API_URL } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { NowPlaying } from '@/components/NowPlaying';
import { QueueList } from '@/components/QueueList';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/Toast';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import type { Venue, QueuedSong, SpotifyStatus } from '@nextup/types';
import styles from '../../admin/[slug]/page.module.css';

type Tab = 'queue' | 'history' | 'settings' | 'stats';

export default function VenueAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [history, setHistory] = useState<QueuedSong[]>([]);
  const [stats, setStats] = useState<{ totalPlayed: number; mostVoted: QueuedSong | null; totalVotes: number } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editBg, setEditBg] = useState('');
  const [editSpotifyId, setEditSpotifyId] = useState('');
  const [editSpotifySecret, setEditSpotifySecret] = useState('');
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiFetch<Venue>(`/venues/${slug}`)
      .then(setVenue)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!venue) return;
    apiFetch<SpotifyStatus>(`/venues/${venue.id}/spotify-status`).then(setSpotifyStatus);
  }, [venue]);

  const { queue, vote, votedSongs, nowPlaying } = useBarQueue(venue?.id || '');

  const handleSkip = async () => {
    if (!venue) return;
    try {
      await apiFetch(`/queue/${venue.id}/skip`, { method: 'POST' });
    } catch {
      toast('No se pudo saltar. Verificá que Spotify esté activo.', 'error');
    }
  };

  const handlePlay = async (songId: string) => {
    if (!venue) return;
    try {
      const res = await apiFetch<{ ok: boolean; error?: string }>(`/queue/${venue.id}/play/${songId}`, { method: 'POST' });
      if (!res.ok) {
        if (res.error === 'NO_DEVICE') {
          toast('No se encontró un dispositivo Spotify activo. Abrí Spotify y reproducí algo brevemente para activarlo.', 'error');
        } else {
          toast('No se pudo reproducir. Verificá que Spotify esté activo.', 'error');
        }
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!venue) return;
    try {
      await apiFetch(`/queue/${venue.id}/songs/${songId}`, { method: 'DELETE' });
    } catch {
      toast('No se pudo eliminar la canción.', 'error');
    }
  };

  const loadHistory = useCallback(async () => {
    if (!venue) return;
    const data = await apiFetch<QueuedSong[]>(`/queue/${venue.id}/history`);
    setHistory(data);
  }, [venue]);

  const loadStats = useCallback(async () => {
    if (!venue) return;
    const data = await apiFetch<{ totalPlayed: number; mostVoted: QueuedSong | null; totalVotes: number }>(`/queue/${venue.id}/stats`);
    setStats(data);
  }, [venue]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadHistory, loadStats]);

  const handleSaveSettings = async () => {
    if (!venue) return;
    const body: Record<string, string> = {};
    if (editName.trim()) body.name = editName.trim();
    if (editPin.trim()) body.adminPin = editPin.trim();
    if (editBg.trim()) body.backgroundImage = editBg.trim();
    if (editSpotifyId.trim()) body.spotifyClientId = editSpotifyId.trim();
    if (editSpotifySecret.trim()) body.spotifyClientSecret = editSpotifySecret.trim();
    if (Object.keys(body).length === 0) return;
    const updated = await apiFetch<Venue>(`/venues/${slug}`, { method: 'PATCH', body: JSON.stringify(body) });
    setVenue(updated);
    setEditName('');
    setEditPin('');
    setEditBg('');
    setEditSpotifyId('');
    setEditSpotifySecret('');
    setSaved(true);
    toast('Cambios guardados', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner} />
          <span>Cargando panel...</span>
        </div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingScreen}>
          <span>Venue no encontrado</span>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'queue', label: 'Cola' },
    { key: 'history', label: 'Historial' },
    { key: 'stats', label: 'Stats' },
    { key: 'settings', label: 'Config' },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <Link href="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600 }}>
              ← Mis Venues
            </Link>
            <h1 className={styles.barName}>{venue.name}</h1>
            <div className={styles.spotifyStatus}>
              {spotifyStatus?.connected ? (
                <span className={styles.connected}>
                  <span className={styles.connDot} />
                  Spotify conectado
                </span>
              ) : (
                <span className={styles.disconnected}>
                  <span className={styles.discDot} />
                  Spotify desconectado
                </span>
              )}
            </div>
          </div>
          {!spotifyStatus?.connected && (
            <a href={`${API_URL}/auth/spotify?venueId=${venue.id}`} className={styles.connectBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Conectar
            </a>
          )}
        </div>
      </header>

      <section className={styles.nowPlaying}>
        <NowPlaying venueId={venue.id} onSkip={handleSkip} externalTrack={nowPlaying} />
      </section>

      <nav className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={styles.tabContent}>
        {activeTab === 'queue' && (
          <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} showDelete onDelete={handleDelete} onPlay={handlePlay} />
        )}

        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className={styles.emptyState}><p>No hay historial todavía</p></div>
            ) : (
              <div className={styles.historyList}>
                {history.map((song) => (
                  <div key={song.id} className={styles.historyItem}>
                    {song.albumArt && <img src={song.albumArt} alt="" className={styles.historyArt} />}
                    <div className={styles.historyInfo}>
                      <div className={styles.historyTitle}>{song.title}</div>
                      <div className={styles.historyArtist}>{song.artist} · {song.votes} votos</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}><AnimatedNumber value={stats.totalPlayed} /></div>
              <div className={styles.statLabel}>Canciones hoy</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}><AnimatedNumber value={stats.totalVotes} /></div>
              <div className={styles.statLabel}>Votos hoy</div>
            </div>
            {stats.mostVoted && (
              <div className={styles.statCardWide}>
                <div className={styles.statLabel}>Más votada hoy</div>
                <div className={styles.mostVotedTitle}>{stats.mostVoted.title}</div>
                <div className={styles.mostVotedSub}>{stats.mostVoted.artist} · {stats.mostVoted.votes} votos</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Spotify Developer</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Creá tu app en{' '}
                <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  developer.spotify.com/dashboard
                </a>
                {' '}y pegá las credenciales acá. Redirect URI:{' '}
                <code style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {typeof window !== 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL || window.location.origin.replace(':3000', ':3001')}/auth/spotify/callback` : ''}
                </code>
              </p>
              <div className={styles.field}>
                <label htmlFor="spotify-client-id">Client ID</label>
                <input id="spotify-client-id" type="text" value={editSpotifyId} onChange={(e) => setEditSpotifyId(e.target.value)} placeholder={venue.spotifyClientId || 'Tu Spotify Client ID'} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="spotify-client-secret">Client Secret</label>
                <input id="spotify-client-secret" type="password" value={editSpotifySecret} onChange={(e) => setEditSpotifySecret(e.target.value)} placeholder="Tu Spotify Client Secret" className={styles.input} />
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Tip DJ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Para que las canciones se mezclen sin silencio, activá <strong style={{ color: 'var(--accent)' }}>Crossfade</strong> en tu app de Spotify:
                Ajustes &gt; Reproducción &gt; Crossfade (recomendado: 5 segundos).
              </p>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>General</h3>
              <div className={styles.field}>
                <label htmlFor="edit-name">Nombre del venue</label>
                <input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={venue.name} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-pin">PIN de admin</label>
                <input id="edit-pin" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))} placeholder="4 dígitos" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-bg">Imagen de fondo (URL)</label>
                <input id="edit-bg" type="url" value={editBg} onChange={(e) => setEditBg(e.target.value)} placeholder={venue.backgroundImage || 'https://ejemplo.com/imagen.jpg'} className={styles.input} />
                {venue.backgroundImage && (
                  <div style={{ marginTop: 8, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={venue.backgroundImage} alt="Fondo actual" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
              </div>
              <button onClick={handleSaveSettings} className={styles.saveBtn}>
                {saved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>QR para clientes</h3>
              <button onClick={() => setShowQR(!showQR)} className={styles.qrToggle}>
                {showQR ? 'Ocultar QR' : 'Mostrar QR'}
              </button>
              {showQR && (
                <div className={styles.qrContainer}>
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/venue/${venue.slug}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                  <span className={styles.qrUrl}>/venue/{venue.slug}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
