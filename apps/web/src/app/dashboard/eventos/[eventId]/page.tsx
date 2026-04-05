'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, API_URL } from '@/lib/api';
import { useEventQueue } from '@/hooks/useEventQueue';
import { NowPlaying } from '@/components/NowPlaying';
import { QueueList } from '@/components/QueueList';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/components/Toast';
import { Coachmark } from '@/components/Coachmark';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import type { Event, EventSong } from '@nextup/types';
import styles from '../../../admin/[slug]/page.module.css';

type Tab = 'queue' | 'history' | 'stats' | 'settings';

export default function EventAdminPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [history, setHistory] = useState<EventSong[]>([]);
  const [stats, setStats] = useState<{ totalPlayed: number; mostVoted: EventSong | null; totalVotes: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editMaxSongs, setEditMaxSongs] = useState('');
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiFetch<Event>(`/events/${eventId}/details`)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const { queue, vote, votedSongs, nowPlaying } = useEventQueue(event?.id || eventId || '');

  const handleSkip = async () => {
    if (!event) return;
    try {
      await apiFetch(`/events/${event.id}/skip`, { method: 'POST' });
    } catch {
      toast('No se pudo saltar', 'error');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!event) return;
    try {
      await apiFetch(`/events/${event.id}/songs/${songId}`, { method: 'DELETE' });
    } catch {
      toast('No se pudo eliminar', 'error');
    }
  };

  const loadHistory = useCallback(async () => {
    if (!event) return;
    const data = await apiFetch<EventSong[]>(`/events/${event.id}/history`);
    setHistory(data);
  }, [event]);

  const loadStats = useCallback(async () => {
    if (!event) return;
    const data = await apiFetch<{ totalPlayed: number; mostVoted: EventSong | null; totalVotes: number }>(`/events/${event.id}/stats`);
    setStats(data);
  }, [event]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    if (activeTab === 'stats') loadStats();
  }, [activeTab, loadHistory, loadStats]);

  const handleSaveSettings = async () => {
    if (!event) return;
    const body: Record<string, any> = {};
    if (editName.trim()) body.name = editName.trim();
    if (editEndsAt) body.endsAt = editEndsAt;
    if (editMaxSongs) body.maxSongsPerUser = Number(editMaxSongs);
    if (Object.keys(body).length === 0) return;
    const updated = await apiFetch<Event>(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(body) });
    setEvent(updated);
    setEditName('');
    setEditEndsAt('');
    setEditMaxSongs('');
    setSaved(true);
    toast('Cambios guardados', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <main className={styles.page}><div className={styles.loadingScreen}><div className={styles.loadingSpinner} /><span>Cargando evento...</span></div></main>;
  }

  if (!event) {
    return <main className={styles.page}><div className={styles.loadingScreen}><span>Evento no encontrado</span></div></main>;
  }

  const spotifyConnected = !!(event as any).spotifyConnected || !!(event as any).spotifyRefreshToken;

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
            <Link href="/dashboard/eventos" className={styles.backLink}>
              ← Mis Eventos
            </Link>
            <h1 className={styles.barName}>{event.name}</h1>
            <div className={styles.spotifyStatus}>
              {spotifyConnected ? (
                <span className={styles.connected}><span className={styles.connDot} />Spotify conectado</span>
              ) : (
                <span className={styles.disconnected}><span className={styles.discDot} />Spotify desconectado</span>
              )}
            </div>
          </div>
          {!spotifyConnected && (
            <a href={`${API_URL}/auth/spotify?eventId=${event.id}`} className={styles.connectBtn} aria-label="Conectar Spotify">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Conectar
            </a>
          )}
        </div>
      </header>

      <section className={styles.nowPlaying}>
        <NowPlaying venueId={event.id} onSkip={handleSkip} externalTrack={nowPlaying} isEvent />
      </section>

      {/* Event time info */}
      {event.startsAt && event.endsAt && (
        <div className={styles.eventTime}>
          {new Date(event.startsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {new Date(event.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Access code + QR */}
      <div data-tour="access-code" className={styles.accessCodeSection}>
        <p className={styles.accessCodeLabel}>Código de acceso</p>
        <p className={styles.accessCode}>{event.accessCode}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(event.accessCode); toast('Código copiado', 'success'); }}
            className={styles.copyCodeBtn}
          >
            Copiar código
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/event/${event.accessCode}`;
              const text = `Unite a ${event.name} y elegí la música! Código: ${event.accessCode}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank');
            }}
            className={styles.copyCodeBtn}
            style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
          >
            Compartir por WhatsApp
          </button>
        </div>
        <p className={styles.accessCodeHint}>Compartilo con tus invitados</p>
        <button onClick={() => setShowQR(!showQR)} className={styles.qrToggle} style={{ marginTop: 12 }}>
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
        {showQR && (
          <div className={styles.qrContainer} style={{ marginTop: 12 }}>
            <QRCodeSVG
              id="event-qr"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/event/${event.accessCode}`}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              aria-label={`QR para unirse al evento ${event.name}`}
            />
            <span className={styles.qrUrl}>/event/{event.accessCode}</span>
            <button
              onClick={() => {
                const svg = document.getElementById('event-qr');
                if (!svg) return;
                const canvas = document.createElement('canvas');
                canvas.width = 400; canvas.height = 400;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const data = new XMLSerializer().serializeToString(svg);
                const img = new Image();
                img.onload = () => {
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(0, 0, 400, 400);
                  ctx.drawImage(img, 0, 0, 400, 400);
                  const a = document.createElement('a');
                  a.download = `qr-${event.accessCode}.png`;
                  a.href = canvas.toDataURL('image/png');
                  a.click();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(data);
              }}
              className={styles.qrToggle}
              style={{ marginTop: 8 }}
            >
              Descargar QR
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <nav className={styles.tabs} data-tour="event-tabs">
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

      <section className={styles.tabContent} data-tour="event-queue">
        {activeTab === 'queue' && (
          <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} showDelete onDelete={handleDelete} />
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
              <div className={styles.statLabel}>Canciones totales</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}><AnimatedNumber value={stats.totalVotes} /></div>
              <div className={styles.statLabel}>Votos totales</div>
            </div>
            {stats.mostVoted && (
              <div className={styles.statCardWide}>
                <div className={styles.statLabel}>Más votada</div>
                <div className={styles.mostVotedTitle}>{stats.mostVoted.title}</div>
                <div className={styles.mostVotedSub}>{stats.mostVoted.artist} · {stats.mostVoted.votes} votos</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>General</h3>
              <div className={styles.field}>
                <label htmlFor="edit-event-name">Nombre del evento</label>
                <input id="edit-event-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={event.name} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-event-ends">Hora de fin</label>
                <input id="edit-event-ends" type="datetime-local" value={editEndsAt} onChange={(e) => setEditEndsAt(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-event-max">Máx. canciones por persona</label>
                <input id="edit-event-max" type="number" min={1} max={20} value={editMaxSongs} onChange={(e) => setEditMaxSongs(e.target.value)} placeholder={String((event as any).maxSongsPerUser || 3)} className={styles.input} />
              </div>
              <button onClick={handleSaveSettings} className={styles.saveBtn}>
                {saved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Spotify</h3>
              {spotifyConnected ? (
                <p className={styles.settingsTextAccent}>Spotify conectado</p>
              ) : (
                <div>
                  <p className={styles.settingsText} style={{ marginBottom: 12 }}>
                    Conectá Spotify para que tus invitados puedan buscar y agregar canciones.
                  </p>
                  <a href={`${API_URL}/auth/spotify?eventId=${event.id}`} className={styles.setupConnectBtn}>
                    Conectar Spotify
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <Coachmark
        id={`event-admin-${eventId}`}
        steps={[
          { target: '[data-tour="access-code"]', text: 'Compartí este código con tus invitados para que puedan pedir canciones. También podés mostrar el QR.' },
          { target: '[data-tour="event-tabs"]', text: 'Cola, historial, stats y configuración de tu evento.' },
        ]}
      />
    </main>
  );
}
