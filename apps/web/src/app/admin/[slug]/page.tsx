'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, API_URL } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { NowPlaying } from '@/components/NowPlaying';
import { QueueList } from '@/components/QueueList';
import { useToast } from '@/components/Toast';
import { QRCodeSVG } from 'qrcode.react';
import type { Venue, QueuedSong, SpotifyStatus } from '@nextup/types';
type Bar = Venue;
import styles from './page.module.css';

type Tab = 'queue' | 'history' | 'settings' | 'stats';

const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
  { key: 'queue', label: 'Cola', icon: 'queue' },
  { key: 'history', label: 'Historial', icon: 'history' },
  { key: 'stats', label: 'Estadísticas', icon: 'stats' },
  { key: 'settings', label: 'Ajustes', icon: 'settings' },
];

function TabIcon({ type }: { type: string }) {
  switch (type) {
    case 'queue':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      );
    case 'history':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'stats':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [history, setHistory] = useState<QueuedSong[]>([]);
  const [stats, setStats] = useState<{ totalPlayed: number; mostVoted: QueuedSong | null; totalVotes: number } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<Bar>(`/venues/${slug}`)
      .then((b) => {
        setBar(b);
        if (!(b as any).hasPin) setAuthenticated(true);
        const s = sessionStorage.getItem(`admin-${slug}`);
        if (s === 'true') setAuthenticated(true);
      })
      .catch((err) => console.error('Failed to load venue:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!bar) return;
    apiFetch<SpotifyStatus>(`/venues/${bar.id}/spotify-status`).then(setSpotifyStatus);
  }, [bar]);

  const { queue, vote, votedSongs } = useBarQueue(bar?.id || '');

  const handlePinSubmit = async () => {
    const res = await apiFetch<{ ok: boolean }>(`/venues/${slug}/verify-pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      setAuthenticated(true);
      sessionStorage.setItem(`admin-${slug}`, 'true');
    } else {
      setPinError(true);
    }
  };

  const handleSkip = async () => {
    if (!bar) return;
    try {
      await apiFetch(`/queue/${bar.id}/skip`, { method: 'POST' });
      toast('Canción saltada', 'success');
    } catch {
      toast('No se pudo saltar. Verificá que Spotify esté activo.', 'error');
    }
  };

  const handlePlay = async (songId: string) => {
    if (!bar) return;
    await apiFetch(`/queue/${bar.id}/play/${songId}`, { method: 'POST' });
  };

  const handleDelete = async (songId: string) => {
    if (!bar) return;
    await apiFetch(`/queue/${bar.id}/songs/${songId}`, { method: 'DELETE' });
  };

  const loadHistory = useCallback(async () => {
    if (!bar) return;
    const data = await apiFetch<QueuedSong[]>(`/queue/${bar.id}/history`);
    setHistory(data);
  }, [bar]);

  const loadStats = useCallback(async () => {
    if (!bar) return;
    const data = await apiFetch<{ totalPlayed: number; mostVoted: QueuedSong | null; totalVotes: number }>(`/queue/${bar.id}/stats`);
    setStats(data);
  }, [bar]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadHistory, loadStats]);

  const handleSaveSettings = async () => {
    if (!bar) return;
    const body: Record<string, string> = {};
    if (editName.trim()) body.name = editName.trim();
    if (editPin.trim()) body.adminPin = editPin.trim();
    if (Object.keys(body).length === 0) return;
    const updated = await apiFetch<Bar>(`/venues/${slug}`, { method: 'PATCH', body: JSON.stringify(body) });
    setBar(updated);
    setEditName('');
    setEditPin('');
    setSaved(true);
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

  if (!bar) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingScreen}>
          <span>Espacio no encontrado</span>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.pinScreen}>
          <div className={styles.pinIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className={styles.pinTitle}>Panel de Admin</h1>
          <p className={styles.pinBarName}>{bar.name}</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="----"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinError(false); }}
            className={`${styles.pinInput} ${pinError ? styles.pinInputError : ''}`}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && pin.length === 4 && handlePinSubmit()}
            aria-label="PIN de 4 dígitos"
            aria-describedby={pinError ? 'pin-hint pin-error' : 'pin-hint'}
            aria-invalid={pinError}
          />
          <p className={styles.pinHint} id="pin-hint">Ingresá el PIN de 4 dígitos</p>
          {pinError && <p className={styles.pinError} role="alert" id="pin-error">PIN incorrecto</p>}
          <button onClick={handlePinSubmit} className={styles.pinBtn} disabled={pin.length < 4}>
            Acceder
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <h1 className={styles.barName}>{bar.name}</h1>
            <div className={styles.spotifyStatus}>
              {spotifyStatus?.connected ? (
                <span className={styles.connected}>
                  <span className={styles.connDot} />
                  Spotify conectado — dejá la app abierta
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
            <a href={`${API_URL}/auth/spotify?venueId=${bar.id}`} className={styles.connectBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Conectar
            </a>
          )}
        </div>
      </header>

      <section className={styles.nowPlaying}>
        <NowPlaying venueId={bar.id} onSkip={handleSkip} />
      </section>

      <nav className={styles.tabs} role="tablist" aria-label="Secciones del panel">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`admin-tabpanel-${tab.key}`}
            id={`admin-tab-${tab.key}`}
          >
            <TabIcon type={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <section className={styles.tabContent} role="tabpanel" id={`admin-tabpanel-${activeTab}`} aria-labelledby={`admin-tab-${activeTab}`}>
        {activeTab === 'queue' && (
          <div className={styles.fadeIn}>
            <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} showDelete onDelete={handleDelete} onPlay={handlePlay} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.fadeIn}>
            {history.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <p>No hay historial todavía</p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {history.map((song, i) => (
                  <div key={song.id} className={styles.historyItem} style={{ animationDelay: `${i * 40}ms` }}>
                    {song.albumArt ? (
                      <img src={song.albumArt} alt={`${song.title} — ${song.artist}`} className={styles.historyArt} />
                    ) : (
                      <div className={styles.historyArtPlaceholder}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                    )}
                    <div className={styles.historyInfo}>
                      <div className={styles.historyTitle}>{song.title}</div>
                      <div className={styles.historyArtist}>{song.artist}</div>
                    </div>
                    <div className={styles.historyVotes}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5m-7 7 7-7 7 7" />
                      </svg>
                      {song.votes}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className={styles.fadeIn}>
            {!stats ? (
              <div className={styles.emptyState}>
                <div className={styles.loadingSpinner} />
                <p>Cargando stats...</p>
              </div>
            ) : (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <div className={styles.statValue}>{stats.totalPlayed}</div>
                  <div className={styles.statLabel}>Canciones hoy</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5m-7 7 7-7 7 7" />
                    </svg>
                  </div>
                  <div className={styles.statValue}>{stats.totalVotes}</div>
                  <div className={styles.statLabel}>Votos hoy</div>
                </div>
                {stats.mostVoted && (
                  <div className={styles.statCardWide}>
                    <div className={styles.statLabel}>Más votada hoy</div>
                    <div className={styles.mostVoted}>
                      {stats.mostVoted.albumArt && (
                        <img src={stats.mostVoted.albumArt} alt={`${stats.mostVoted.title} — ${stats.mostVoted.artist}`} className={styles.mostVotedArt} />
                      )}
                      <div>
                        <div className={styles.mostVotedTitle}>{stats.mostVoted.title}</div>
                        <div className={styles.mostVotedSub}>{stats.mostVoted.artist} &middot; {stats.mostVoted.votes} votos</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`${styles.fadeIn} ${styles.settings}`}>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>General</h3>
              <div className={styles.field}>
                <label htmlFor="admin-edit-name">Nombre del venue</label>
                <input
                  id="admin-edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={bar.name}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="admin-edit-pin">PIN de admin</label>
                <input
                  id="admin-edit-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4 dígitos"
                  className={styles.input}
                />
              </div>
              <button onClick={handleSaveSettings} className={styles.saveBtn}>
                {saved ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Guardado
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>QR para clientes</h3>
              <p className={styles.settingsDesc}>Imprimí este QR y ponelo visible en el bar</p>
              <button onClick={() => setShowQR(!showQR)} className={styles.qrToggle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
                {showQR ? 'Ocultar QR' : 'Mostrar QR'}
              </button>
              {showQR && (
                <div className={styles.qrContainer}>
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/venue/${bar.slug}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                  <span className={styles.qrUrl}>/venue/{bar.slug}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
