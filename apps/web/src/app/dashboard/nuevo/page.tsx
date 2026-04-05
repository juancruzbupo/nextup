'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import type { Venue } from '@nextup/types';
import styles from '../../auth.module.css';

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewVenuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugEdited) setSlug(toSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const venue = await apiFetch<Venue>('/venues', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
          ...(pin ? { adminPin: pin } : {}),
        }),
      });
      router.push(`/dashboard/${venue.slug}`);
    } catch {
      setError('El slug ya está en uso o hubo un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <h1 className={styles.title}>Crear venue</h1>
        <p className={styles.subtitle}>Bar, evento, cumpleaños, gym, lo que quieras</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="venue-name">Nombre</label>
            <input id="venue-name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Mi Bar, Fiesta de Juan, etc." required autoFocus />
          </div>
          <div className={styles.field}>
            <label htmlFor="venue-slug">Dirección web</label>
            <input
              id="venue-slug"
              type="text"
              value={slug}
              onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
              placeholder="mi-bar"
              required
              pattern="[a-z0-9\-]+"
              aria-describedby="slug-preview"
            />
            <span id="slug-preview" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Tus clientes van a entrar en: /venue/{slug || '...'}</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="venue-pin">PIN de admin (opcional)</label>
            <input id="venue-pin" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4 dígitos" />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Para que un empleado acceda al panel sin tu cuenta</span>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={loading || !name || !slug}>
            {loading ? 'Creando...' : 'Crear venue'}
          </button>
        </form>

        <p className={styles.link}>
          <Link href="/dashboard">Volver al dashboard</Link>
        </p>
      </div>
    </main>
  );
}
