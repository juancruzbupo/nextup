'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import styles from '../dashboard.module.css';

interface EventItem {
  id: string;
  name: string;
  accessCode: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  spotifyConnected: boolean;
}

function eventStatus(event: EventItem): string {
  const now = new Date();
  if (!event.active || new Date(event.endsAt) < now) return 'Finalizado';
  if (new Date(event.startsAt) > now) return 'Próximo';
  return 'Activo';
}

export default function EventsListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    apiFetch<EventItem[]>('/events/my')
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return <main className={styles.page}><div className={styles.loading}>Cargando...</div></main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Eventos</h1>
          <Link href="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>← Volver al dashboard</Link>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/nuevo-evento" className={styles.createBtn}>+ Crear evento</Link>
        </div>
      </header>

      {events.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>No tenés eventos</p>
          <p className={styles.emptySub}>Creá tu primer evento para empezar</p>
          <Link href="/dashboard/nuevo-evento" className={styles.emptyBtn}>Crear mi primer evento</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => {
            const status = eventStatus(event);
            return (
              <Link key={event.id} href={`/dashboard/eventos/${event.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardName}>{event.name}</h2>
                  <span className={`${styles.cardStatus} ${status === 'Activo' ? styles.connected : ''}`}>
                    {status}
                  </span>
                </div>
                <div className={styles.cardSlug}>Código: {event.accessCode}</div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
