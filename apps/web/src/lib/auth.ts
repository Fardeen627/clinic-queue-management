import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export type AuthRole = 'admin' | 'staff';

const TOKEN_KEY = 'clinic-queue-token';
const ROLE_KEY = 'clinic-queue-role';

export function getStoredAuth() {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const role = window.localStorage.getItem(ROLE_KEY) as AuthRole | null;
  if (!token || !role) return null;
  return { token, role };
}

export function saveAuth(token: string, role: AuthRole) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

export function useAuth() {
  const [auth, setAuth] = useState<{ token: string; role: AuthRole } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuth(getStoredAuth());
    setLoading(false);
  }, []);

  return { auth, loading };
}

export function useRequireRole(roles: AuthRole[]) {
  const router = useRouter();
  const { auth, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!auth) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!roles.includes(auth.role)) {
      router.replace(`/login?role=${roles[0]}&next=${encodeURIComponent(router.asPath)}`);
    }
  }, [auth, loading, roles, router]);

  return { auth, loading };
}
