'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch, API_URL } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { NowPlaying } from '@/components/NowPlaying';
import { QueueList } from '@/components/QueueList';
import { QRCodeSVG } from 'qrcode.react';
import type { Bar, QueuedSong, SpotifyStatus } from '@barjukebox/types';
import styles from './page.module.css';

type Tab = 'queue' | 'history' | 'settings' | 'stats';

export default function AdminPage() {
  const { slug } = useParams<{ slug: string }>();
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

  useEffect(() => {
    apiFetch<Bar>(`/bars/${slug}`)
      .then((b) => {
        setBar(b);
        if (!b.adminPin) setAuthenticated(true);
        const saved = sessionStorage.getItem(`admin-${slug}`);
        if (saved === 'true') setAuthenticated(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!bar) return;
    apiFetch<SpotifyStatus>(`/bars/${bar.id}/spotify-status`).then(setSpotifyStatus);
  }, [bar]);

  const { queue, vote, votedSongs } = useBarQueue(bar?.id || '');

  const handlePinSubmit = async () => {
    const res = await apiFetch<{ ok: boolean }>(`/bars/${slug}/verify-pin`, {
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
    await apiFetch(`/queue/${bar.id}/skip`, { method: 'POST' });
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
    const updated = await apiFetch<Bar>(`/bars/${slug}`, { method: 'PATCH', body: JSON.stringify(body) });
    setBar(updated);
    setEditName('');
    setEditPin('');
  };

  if (loading) {
    return <main className={styles.page}><div className={styles.loading}>Cargando...</div></main>;
  }

  if (!bar) {
    return <main className={styles.page}><div className={styles.loading}>Bar no encontrado</div></main>;
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <div className={styles.pinScreen}>
          <h1>Panel de Admin</h1>
          <p className={styles.pinLabel}>{bar.name}</p>
          <input
            type="password"
            maxLength={4}
            placeholder="PIN de 4 dígitos"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            className={styles.pinInput}
            autoFocus
          />
          {pinError && <p className={styles.pinError}>PIN incorrecto</p>}
          <button onClick={handlePinSubmit} className={styles.pinBtn} disabled={pin.length < 4}>
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.barName}>{bar.name}</h1>
          <div className={styles.spotifyStatus}>
            {spotifyStatus?.connected ? (
              <span className={styles.connected}>✓ Spotify conectado</span>
            ) : (
              <>
                <span className={styles.disconnected}>✗ Spotify no conectado</span>
                <a href={`${API_URL}/auth/spotify?barId=${bar.id}`} className={styles.connectBtn}>
                  Conectar Spotify
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <section className={styles.nowPlaying}>
        <NowPlaying barId={bar.id} />
        <button onClick={handleSkip} className={styles.skipBtn}>⏭ Saltar canción</button>
      </section>

      <nav className={styles.tabs}>
        {(['queue', 'history', 'stats', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
          >
            {tab === 'queue' ? 'Cola' : tab === 'history' ? 'Historial' : tab === 'stats' ? 'Stats' : 'Config'}
          </button>
        ))}
      </nav>

      <section className={styles.tabContent}>
        {activeTab === 'queue' && (
          <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} showDelete onDelete={handleDelete} />
        )}

        {activeTab === 'history' && (
          <div className={styles.historyList}>
            {history.length === 0 && <p className={styles.emptyText}>No hay historial todavía</p>}
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

        {activeTab === 'stats' && stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalPlayed}</div>
              <div className={styles.statLabel}>Canciones hoy</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalVotes}</div>
              <div className={styles.statLabel}>Votos hoy</div>
            </div>
            {stats.mostVoted && (
              <div className={styles.statCardWide}>
                <div className={styles.statLabel}>Más votada hoy</div>
                <div className={styles.statValue}>{stats.mostVoted.title}</div>
                <div className={styles.statSub}>{stats.mostVoted.artist} · {stats.mostVoted.votes} votos</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <div className={styles.field}>
              <label>Nombre del bar</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={bar.name}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label>Nuevo PIN de admin</label>
              <input
                type="password"
                maxLength={4}
                value={editPin}
                onChange={(e) => setEditPin(e.target.value)}
                placeholder="••••"
                className={styles.input}
              />
            </div>
            <button onClick={handleSaveSettings} className={styles.saveBtn}>Guardar cambios</button>

            <div className={styles.qrSection}>
              <button onClick={() => setShowQR(!showQR)} className={styles.qrToggle}>
                {showQR ? 'Ocultar QR' : 'Generar QR para clientes'}
              </button>
              {showQR && (
                <div className={styles.qrContainer}>
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/bar/${bar.slug}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                  <p className={styles.qrUrl}>/bar/{bar.slug}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
