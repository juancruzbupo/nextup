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
import type { Event, EventSong } from '@nextup/types';
import styles from '../../../admin/[slug]/page.module.css';

export default function EventAdminPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
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
        <button
          onClick={() => { navigator.clipboard.writeText(event.accessCode); toast('Código copiado', 'success'); }}
          className={styles.copyCodeBtn}
        >
          Copiar código
        </button>
        <p className={styles.accessCodeHint}>Compartilo con tus invitados</p>
        <button onClick={() => setShowQR(!showQR)} className={styles.qrToggle} style={{ marginTop: 12 }}>
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
        {showQR && (
          <div className={styles.qrContainer} style={{ marginTop: 12 }}>
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/event/${event.accessCode}`}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              aria-label={`QR para unirse al evento ${event.name}`}
            />
            <span className={styles.qrUrl}>/event/{event.accessCode}</span>
          </div>
        )}
      </div>

      {/* Queue */}
      <section className={styles.tabContent} data-tour="event-queue">
        <QueueList queue={queue} onVote={vote} votedSongs={votedSongs} showDelete onDelete={handleDelete} />
      </section>

      <Coachmark
        id={`event-admin-${eventId}`}
        steps={[
          { target: '[data-tour="access-code"]', text: 'Compartí este código con tus invitados para que puedan pedir canciones. También podés mostrar el QR.' },
          { target: '[data-tour="event-queue"]', text: 'Acá ves las canciones que pidieron. Podés eliminar las que no quieras.' },
        ]}
      />
    </main>
  );
}
