'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type { Venue } from '@nextup/types';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    apiFetch<Venue[]>('/venues/my')
      .then(setVenues)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Cargando...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Venues</h1>
          <p className={styles.subtitle}>Hola, {user?.name}</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/nuevo" className={styles.createBtn}>
            + Venue
          </Link>
          <Link href="/dashboard/nuevo-evento" className={styles.createBtn}>
            + Evento
          </Link>
          <Link href="/dashboard/eventos" className={styles.logoutBtn}>
            Mis Eventos
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
          <p className={styles.emptyTitle}>No tenés venues todavía</p>
          <p className={styles.emptySub}>Un venue es un lugar fijo (bar, gym, comedor). Para algo temporal (cumple, previa, casamiento), creá un evento.</p>
          <Link href="/dashboard/nuevo" className={styles.emptyBtn}>Crear mi primer venue</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {venues.map((venue) => (
            <Link key={venue.id} href={`/dashboard/${venue.slug}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardName}>{venue.name}</h2>
                <span className={`${styles.cardStatus} ${venue.spotifyRefreshToken ? styles.connected : ''}`}>
                  {venue.spotifyRefreshToken ? 'Spotify conectado' : 'Sin Spotify'}
                </span>
              </div>
              <div className={styles.cardSlug}>/venue/{venue.slug}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
