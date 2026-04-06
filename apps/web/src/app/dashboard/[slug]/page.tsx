'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, API_URL } from '@/lib/api';
import { useBarQueue } from '@/hooks/useBarQueue';
import { useAdminPanel } from '@/hooks/useAdminPanel';
import { NowPlaying } from '@/components/NowPlaying';
import { AdminTabs } from '@/components/AdminTabs';
import { SpotifySetupWizard } from '@/components/SpotifySetupWizard';
import { AccessCodeCard } from '@/components/AccessCodeCard';
import { Coachmark } from '@/components/Coachmark';
import { useToast } from '@/components/Toast';
import type { Venue, SpotifyStatus } from '@nextup/types';
import styles from '../../admin/[slug]/page.module.css';

export default function VenueAdminPageWrapper() {
  return <Suspense><VenueAdminPage /></Suspense>;
}

function VenueAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editBg, setEditBg] = useState('');

  useEffect(() => {
    apiFetch<Venue>(`/venues/${slug}`)
      .then(setVenue)
      .catch((err) => console.error('Failed to load venue:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!venue) return;
    apiFetch<SpotifyStatus>(`/venues/${venue.id}/spotify-status`).then(setSpotifyStatus);
  }, [venue]);

  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') {
      toast('Spotify conectado correctamente', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  const { queue, vote, votedSongs, nowPlaying } = useBarQueue(venue?.id || '');

  const admin = useAdminPanel({
    entityId: venue?.id || '',
    entityType: 'venue',
    historyEndpoint: `/queue/${venue?.id}/history`,
    statsEndpoint: `/queue/${venue?.id}/stats`,
    saveEndpoint: `/venues/${slug}`,
  });

  const handleSkip = async () => {
    if (!venue) return;
    try {
      await apiFetch(`/queue/${venue.id}/skip`, { method: 'POST' });
      toast('Canción saltada', 'success');
    } catch {
      toast('No se pudo saltar. Verificá que Spotify esté activo.', 'error');
    }
  };

  const handlePlay = async (songId: string) => {
    if (!venue) return;
    try {
      const res = await apiFetch<{ ok: boolean; error?: string }>(`/queue/${venue.id}/play/${songId}`, { method: 'POST' });
      if (!res.ok) {
        toast(res.error === 'NO_DEVICE'
          ? 'No se encontró un dispositivo Spotify activo. Abrí Spotify y reproducí algo brevemente para activarlo.'
          : 'No se pudo reproducir. Verificá que Spotify esté activo.', 'error');
      }
    } catch {
      toast('Error de conexión con el servidor.', 'error');
    }
  };

  const handleDelete = async (songId: string) => {
    if (!venue) return;
    try { await apiFetch(`/queue/${venue.id}/songs/${songId}`, { method: 'DELETE' }); }
    catch { toast('No se pudo eliminar la canción.', 'error'); }
  };

  const handleSaveSettings = async () => {
    const body: Record<string, string> = {};
    if (editName.trim()) body.name = editName.trim();
    if (editPin.trim()) body.adminPin = editPin.trim();
    if (editBg.trim()) body.backgroundImage = editBg.trim();
    const updated = await admin.handleSave(body);
    if (updated) {
      setVenue(updated as Venue);
      setEditName(''); setEditPin(''); setEditBg('');
    }
  };

  if (loading) {
    return <main className={styles.page}><div className={styles.loadingScreen}><div className={styles.loadingSpinner} /><span>Cargando panel...</span></div></main>;
  }

  if (!venue) {
    return <main className={styles.page}><div className={styles.loadingScreen}><span>Espacio no encontrado</span></div></main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <Link href="/dashboard" className={styles.backLink}>← Mis Espacios</Link>
            <h1 className={styles.barName}>{venue.name}</h1>
            <Link href={`/venue/${venue.slug}`} target="_blank" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
              Ver como cliente →
            </Link>
            <div className={styles.spotifyStatus}>
              {spotifyStatus?.connected && !spotifyStatus?.tokenValid ? (
                <span style={{ color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
                  Spotify expirado — reconectá tu cuenta
                </span>
              ) : spotifyStatus?.connected ? (
                <span className={styles.connected}><span className={styles.connDot} />Spotify conectado — dejá la app abierta</span>
              ) : (
                <span className={styles.disconnected}><span className={styles.discDot} />Spotify desconectado</span>
              )}
            </div>
          </div>
          {(!spotifyStatus?.connected || !spotifyStatus?.tokenValid) && (
            <a href={`${API_URL}/auth/spotify?venueId=${venue.id}`} className={styles.connectBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Conectar
            </a>
          )}
        </div>
      </header>

      {!spotifyStatus?.connected && (
        <SpotifySetupWizard entityId={venue.id} entityType="venue" styles={styles} />
      )}

      {spotifyStatus?.connected && (
        <section className={styles.nowPlaying} data-tour="nowplaying">
          <NowPlaying venueId={venue.id} onSkip={handleSkip} externalTrack={nowPlaying} />
        </section>
      )}

      {spotifyStatus?.connected && (
        <AccessCodeCard code={venue.slug} name={venue.name} entityType="venue" styles={styles} />
      )}

      <AdminTabs
        activeTab={admin.activeTab}
        setActiveTab={admin.setActiveTab}
        queue={queue}
        onVote={vote}
        votedSongs={votedSongs}
        onDelete={handleDelete}
        onPlay={handlePlay}
        history={admin.history}
        stats={admin.stats}
        saved={admin.saved}
        ariaPrefix="venue"
        styles={styles}
        playlistLoading={playlistLoading}
        onGeneratePlaylist={async () => {
          if (!venue) return;
          setPlaylistLoading(true);
          try {
            const result = await apiFetch<{ playlistUrl: string; trackCount: number }>(`/queue/${venue.id}/generate-playlist`, { method: 'POST' });
            toast(`Playlist con ${result.trackCount} canciones creada!`, 'success');
            window.open(result.playlistUrl, '_blank');
          } catch {
            toast('No se pudo generar la playlist. ¿Hay canciones reproducidas?', 'error');
          } finally {
            setPlaylistLoading(false);
          }
        }}
        settingsContent={
          <div className={styles.settings}>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Spotify</h3>
              {spotifyStatus?.connected ? (
                <div>
                  <p className={styles.settingsTextAccent}>Tu cuenta Spotify está vinculada</p>
                  <p className={styles.settingsText} style={{ marginBottom: 12 }}>
                    La música se controla automáticamente desde Nextup. Asegurate de tener Spotify abierto en el dispositivo donde querés que suene (celular, parlante, compu).
                  </p>
                  <button
                    onClick={async () => {
                      if (!confirm('¿Seguro que querés desconectar Spotify? Tus clientes no van a poder agregar canciones hasta que lo vuelvas a conectar.')) return;
                      await apiFetch('/auth/spotify/disconnect', { method: 'POST', body: JSON.stringify({ venueId: venue.id }) });
                      setSpotifyStatus({ connected: false, tokenValid: false });
                      toast('Spotify desconectado', 'info');
                    }}
                    className={styles.qrToggle}
                  >Desconectar Spotify</button>
                </div>
              ) : (
                <div>
                  <p className={styles.settingsText} style={{ marginBottom: 12 }}>
                    Conectá tu cuenta Spotify Premium para que Nextup controle la música. La versión gratuita no funciona.
                  </p>
                  <a href={`${API_URL}/auth/spotify?venueId=${venue.id}`} className={styles.setupConnectBtn}>Conectar Spotify</a>
                </div>
              )}
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Tip DJ</h3>
              <p className={styles.settingsText}>
                Para que las canciones se mezclen sin silencio, activá <strong style={{ color: 'var(--accent)' }}>Crossfade</strong> en tu app de Spotify: Ajustes &gt; Reproducción &gt; Crossfade (recomendado: 5 segundos).
              </p>
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>General</h3>
              <div className={styles.field}>
                <label htmlFor="edit-name">Nombre del espacio</label>
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
                  <div className={styles.bgPreview}><img src={venue.backgroundImage} alt="Fondo actual" className={styles.bgPreviewImg} /></div>
                )}
              </div>
              <button onClick={handleSaveSettings} className={styles.saveBtn}>{admin.saved ? 'Guardado' : 'Guardar cambios'}</button>
            </div>
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>Funcionalidades</h3>
              <p className={styles.settingsText} style={{ marginBottom: 12 }}>Activá o desactivá funciones para tus clientes.</p>
              {[
                { key: 'enableDedications', label: 'Dedicatorias', desc: 'Tus clientes pueden dedicar canciones' },
                { key: 'enableGroupNames', label: 'Mesas / Grupos', desc: 'Tus clientes pueden ponerle nombre a su grupo' },
                { key: 'enableReactions', label: 'Reacciones con emojis', desc: 'Emojis flotantes mientras suena una canción' },
                { key: 'enableDJBattle', label: 'Batalla de DJs', desc: 'Modo competencia entre dos DJs' },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{label}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(venue as any)?.[key] ?? false}
                    onChange={async (e) => {
                      const updated = await apiFetch<Venue>(`/venues/${slug}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ [key]: e.target.checked }),
                      });
                      setVenue(updated);
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
        id={`admin-${venue.slug}`}
        steps={[
          { target: '[data-tour="nowplaying"]', text: 'Acá ves lo que suena ahora. Podés saltar la canción.' },
          { target: '[data-tour="tabs"]', text: 'Cola, historial, estadísticas y ajustes. En Ajustes compartí el QR.' },
        ]}
      />
    </main>
  );
}
