'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@nextup/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthInternal();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function useAuthInternal(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if already logged in on mount (single attempt, refresh if needed)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiFetch<{ user: User }>('/auth/me');
        setUser(data.user);
      } catch (err) {
        // Only try refresh if we got 401 (token expired, not missing)
        if ((err as any)?.status === 401) {
          try {
            await apiFetch('/auth/refresh', { method: 'POST' });
            const data = await apiFetch<{ user: User }>('/auth/me');
            setUser(data.user);
            return;
          } catch {}
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const data = await apiFetch<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
