'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Event } from '@nextup/types';
import styles from '../../auth.module.css';

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [pin, setPin] = useState('');
  const [maxSongs, setMaxSongs] = useState(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const event = await apiFetch<Event>('/events', {
        method: 'POST',
        body: JSON.stringify({
          name,
          startsAt,
          endsAt,
          ...(pin ? { adminPin: pin } : {}),
          maxSongsPerUser: maxSongs,
        }),
      });
      router.push(`/dashboard/eventos/${event.id}`);
    } catch {
      setError('Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h1 className={styles.title}>Crear evento</h1>
        <p className={styles.subtitle}>Casamiento, cumple, previa, lo que quieras</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="event-name">Nombre del evento</label>
            <input id="event-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cumple de Sofi, Casamiento J&M..." required autoFocus />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-start">Inicio</label>
            <input id="event-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-end">Fin</label>
            <input id="event-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-max">Máx. canciones por persona</label>
            <input id="event-max" type="number" min={1} max={20} value={maxSongs} onChange={(e) => setMaxSongs(Number(e.target.value))} />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-pin">PIN de admin (opcional)</label>
            <input id="event-pin" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 dígitos" />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={loading || !name || !startsAt || !endsAt}>
            {loading ? 'Creando...' : 'Crear evento'}
          </button>
        </form>

        <p className={styles.link}>
          <Link href="/dashboard">Volver al dashboard</Link>
        </p>
      </div>
    </main>
  );
}
