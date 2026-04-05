'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const toast = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [authLoading, user, router]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Don't flash the login form while checking auth
  if (authLoading || user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Accedé a tu panel de Nextup</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required autoFocus />
          </div>
          <div className={styles.field}>
            <label htmlFor="login-password">Contraseña</label>
            <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" required minLength={6} />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button
            type="button"
            onClick={() => toast('Escribinos a soporte para restablecer tu contraseña.', 'info')}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.link}>
          No tenés cuenta? <Link href="/registro">Registrarse</Link>
        </p>
      </div>
    </main>
  );
}
