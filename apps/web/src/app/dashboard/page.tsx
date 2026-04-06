'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type { Venue } from '@nextup/types';
import { Coachmark } from '@/components/Coachmark';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    let retried = false;
    const fetchVenues = async () => {
      try {
        const [venueData, eventData] = await Promise.all([
          apiFetch<Venue[]>('/venues/my').catch(() => []),
          apiFetch<any[]>('/events/my').catch(() => []),
        ]);
        setVenues(venueData);
        // New user with no venues and no events → show wizard
        if (venueData.length === 0 && eventData.length === 0) {
          router.replace('/dashboard/empezar');
          return;
        }
        // User has only events, no venues → go to events list
        if (venueData.length === 0 && eventData.length > 0) {
          router.replace('/dashboard/eventos');
          return;
        }
      } catch {
        if (!retried) {
          retried = true;
          setTimeout(fetchVenues, 1000);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <main className={styles.page} id="main-content">
        <header className={styles.header}>
          <div>
            <div style={{ width: 160, height: 24, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
            <div style={{ width: 100, height: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </header>
        <div className={styles.grid}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.card} style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <div className={styles.cardHeader}>
                <div style={{ width: '60%', height: 18, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ width: 60, height: 24, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)' }} />
              </div>
              <div className={styles.cardProgress} style={{ marginTop: 12 }}>
                <div style={{ width: '30%', height: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ width: '30%', height: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }} />
                <div style={{ width: '30%', height: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Espacios</h1>
          <p className={styles.subtitle}>Hola, {user?.name}</p>
        </div>
        <div className={styles.headerActions} data-tour="actions">
          <Link href="/dashboard/nuevo" className={styles.createBtn}>
            + Espacio
          </Link>
          <Link href="/dashboard/nuevo-evento" className={styles.createBtn}>
            + Evento
          </Link>
          <Link href="/dashboard/eventos" className={styles.logoutBtn}>
            Mis Eventos
          </Link>
          <Link href="/como-funciona" target="_blank" className={styles.logoutBtn}>
            Ayuda
          </Link>
          <button onClick={logout} className={styles.logoutBtn}>
            Salir
          </button>
        </div>
      </header>

      {venues.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>No tenés espacios todavía</p>
          <p className={styles.emptySub}>Un espacio es un lugar fijo (bar, gym, comedor). Para algo temporal (cumple, previa, casamiento), creá un evento.</p>
          <Link href="/dashboard/nuevo" className={styles.emptyBtn}>Crear mi primer espacio</Link>
        </div>
      ) : (
        <div className={styles.grid} data-tour="venues">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/dashboard/${venue.slug}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardName}>{venue.name}</h2>
                <span className={`${styles.cardStatus} ${(venue as any).spotifyConnected ? styles.connected : ''}`}>
                  {(venue as any).spotifyConnected ? 'Listo' : 'Configurar'}
                </span>
              </div>
              <div className={styles.cardProgress}>
                <div className={styles.step}>
                  <span className={styles.stepDone}>1</span>
                  <span>Espacio creado</span>
                </div>
                <div className={styles.step}>
                  {(venue as any).spotifyConnected
                    ? <span className={styles.stepDone}>2</span>
                    : <span className={styles.stepPending}>2</span>
                  }
                  <span>{(venue as any).spotifyConnected ? 'Spotify conectado' : 'Conectar Spotify'}</span>
                </div>
                <div className={styles.step}>
                  {(venue as any).spotifyConnected
                    ? <span className={styles.stepDone}>3</span>
                    : <span className={styles.stepPending}>3</span>
                  }
                  <span>{(venue as any).spotifyConnected ? 'QR disponible' : 'Compartir QR'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Coachmark
        id="dashboard"
        steps={[
          { target: '[data-tour="actions"]', text: 'Creá un espacio (bar, gym) o un evento (cumple, previa) desde acá.' },
          { target: '[data-tour="venues"]', text: 'Tocá un espacio para administrarlo, conectar Spotify y compartir el QR.' },
        ]}
      />
    </main>
  );
}
