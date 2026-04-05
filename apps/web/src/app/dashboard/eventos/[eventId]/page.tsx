'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, API_URL } from '@/lib/api';
import { useEventQueue } from '@/hooks/useEventQueue';
import { useAdminPanel } from '@/hooks/useAdminPanel';
import { NowPlaying } from '@/components/NowPlaying';
import { AdminTabs } from '@/components/AdminTabs';
import { AccessCodeCard } from '@/components/AccessCodeCard';
import { Coachmark } from '@/components/Coachmark';
import { useToast } from '@/components/Toast';
import type { Event } from '@nextup/types';
import styles from '../../../admin/[slug]/page.module.css';

export default function EventAdminPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editMaxSongs, setEditMaxSongs] = useState('');

  useEffect(() => {
    apiFetch<Event>(`/events/${eventId}/details`)
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') {
      toast('Spotify conectado correctamente', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  const { queue, vote, votedSongs, nowPlaying } = useEventQueue(event?.id || eventId || '');

  const admin = useAdminPanel({
    entityId: event?.id || '',
    entityType: 'event',
    historyEndpoint: `/events/${event?.id}/history`,
    statsEndpoint: `/events/${event?.id}/stats`,
    saveEndpoint: `/events/${eventId}`,
  });

  const handleSkip = async () => {
    if (!event) return;
    try {
      await apiFetch(`/events/${event.id}/skip`, { method: 'POST' });
      toast('Canción saltada', 'success');
    } catch {
      toast('No se pudo saltar', 'error');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!event) return;
    try { await apiFetch(`/events/${event.id}/songs/${songId}`, { method: 'DELETE' }); }
    catch { toast('No se pudo eliminar', 'error'); }
  };

  const handleSaveSettings = async () => {
    const body: Record<string, any> = {};
    if (editName.trim()) body.name = editName.trim();
    if (editEndsAt) body.endsAt = editEndsAt;
    if (editMaxSongs) body.maxSongsPerUser = Number(editMaxSongs);
    const updated = await admin.handleSave(body);
    if (updated) {
      setEvent(updated as Event);
      setEditName(''); setEditEndsAt(''); setEditMaxSongs('');
    }
  };

  if (loading) {
    return <main className={styles.page}><div className={styles.loadingScreen}><div className={styles.loadingSpinner} /><span>Cargando evento...</span></div></main>;
  }

  if (!event) {
    return <main className={styles.page}><div className={styles.loadingScreen}><span>Evento no encontrado</span></div></main>;
  }

  const spotifyConnected = !!(event as any).spotifyConnected || !!(event as any).spotifyRefreshToken;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/dashboard/eventos" className={styles.backLink}>← Mis Eventos</Link>
              <button
                onClick={async () => {
                  if (!confirm('¿Seguro que querés finalizar este evento? Los invitados ya no podrán agregar canciones.')) return;
                  try {
                    await apiFetch(`/events/${event.id}`, { method: 'DELETE' });
                    toast('Evento finalizado', 'success');
                    window.location.href = '/dashboard/eventos';
                  } catch { toast('No se pudo finalizar el evento', 'error'); }
                }}
                className={styles.backLink}
                style={{ color: 'var(--danger-text)' }}
              >Finalizar evento</button>
            </div>
            <h1 className={styles.barName}>{event.name}</h1>
            <div className={styles.spotifyStatus}>
              {spotifyConnected ? (
                <span className={styles.connected}><span className={styles.connDot} />Spotify conectado — dejá la app abierta</span>
              ) : (
                <span className={styles.disconnected}><span className={styles.discDot} />Spotify desconectado</span>
              )}
            </div>
          </div>
          {!spotifyConnected && (
            <a href={`${API_URL}/auth/spotify?eventId=${event.id}`} className={styles.connectBtn} aria-label="Conectar Spotify">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Conectar
            </a>
          )}
        </div>
      </header>

      <section className={styles.nowPlaying}>
        <NowPlaying venueId={event.id} onSkip={handleSkip} externalTrack={nowPlaying} isEvent />
      </section>

      {event.startsAt && event.endsAt && (
        <div className={styles.eventTime}>
          {new Date(event.startsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {new Date(event.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <AccessCodeCard code={event.accessCode} name={event.name} entityType="event" styles={styles} />

      <AdminTabs
        activeTab={admin.activeTab}
        setActiveTab={admin.setActiveTab}
        queue={queue}
        onVote={vote}
        votedSongs={votedSongs}
        onDelete={handleDelete}
        history={admin.history}
        stats={admin.stats}
        saved={admin.saved}
        statsLabel={{ played: 'Canciones totales', votes: 'Votos totales' }}
        ariaPrefix="event"
        playlistLoading={playlistLoading}
        onGeneratePlaylist={async () => {
          if (!event) return;
          setPlaylistLoading(true);
          try {
            const result = await apiFetch<{ playlistUrl: string; trackCount: number }>(`/events/${event.id}/generate-playlist`, { method: 'POST' });
            toast(`Playlist con ${result.trackCount} canciones creada!`, 'success');
            window.open(result.playlistUrl, '_blank');
          } catch {
            toast('No se pudo generar la playlist. ¿Hay canciones reproducidas?', 'error');
          } finally {
            setPlaylistLoading(false);
          }
        }}
        styles={styles}
        settingsContent={
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
              <button onClick={handleSaveSettings} className={styles.saveBtn}>{admin.saved ? 'Guardado' : 'Guardar cambios'}</button>
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Spotify</h3>
              {spotifyConnected ? (
                <p className={styles.settingsTextAccent}>Spotify conectado</p>
              ) : (
                <div>
                  <p className={styles.settingsText} style={{ marginBottom: 12 }}>
                    Conectá tu cuenta Spotify Premium para que tus invitados puedan buscar y agregar canciones. La versión gratuita no funciona.
                  </p>
                  <a href={`${API_URL}/auth/spotify?eventId=${event.id}`} className={styles.setupConnectBtn}>Conectar Spotify</a>
                </div>
              )}
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Funcionalidades</h3>
              {[
                { key: 'enableDedications', label: 'Dedicatorias' },
                { key: 'enableGroupNames', label: 'Mesas / Grupos' },
                { key: 'enableReactions', label: 'Reacciones con emojis' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{label}</span>
                  <input
                    type="checkbox"
                    checked={(event as any)?.[key] ?? true}
                    onChange={async (e) => {
                      const updated = await apiFetch<Event>(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify({ [key]: e.target.checked }) });
                      setEvent(updated);
                      toast(`${label} ${e.target.checked ? 'activado' : 'desactivado'}`, 'success');
                    }}
                    style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
                  />
                </label>
              ))}
            </div>
          </div>
        }
      />

      <Coachmark
        id={`event-admin-${eventId}`}
        steps={[
          { target: '[data-tour="access-code"]', text: 'Compartí este código con tus invitados para que puedan pedir canciones.' },
          { target: '[data-tour="event-tabs"]', text: 'Cola, historial, estadísticas y ajustes de tu evento.' },
        ]}
      />
    </main>
  );
}
