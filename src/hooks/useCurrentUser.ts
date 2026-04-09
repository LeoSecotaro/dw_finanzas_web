import React from 'react';
import { getCurrentUser } from '../api/usersApi';

// simple hook with sessionStorage fallback to avoid repeated requests
export default function useCurrentUser() {
  const [user, setUser] = React.useState<any | null>(() => {
    try {
      const raw = sessionStorage.getItem('current_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = React.useState<boolean>(() => user === null);
  const mountedRef = React.useRef(true);

  const refetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getCurrentUser();
      const u = resp?.data ?? null;
      if (!mountedRef.current) return;
      setUser(u);
      try { sessionStorage.setItem('current_user', JSON.stringify(u)); } catch (e) { /* ignore */ }
    } catch (e) {
      if (!mountedRef.current) return;
      setUser(null);
      try { sessionStorage.removeItem('current_user'); } catch (er) { /* ignore */ }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    // always try to refresh in background (but don't block initial paint)
    (async () => {
      // call refetch to keep single logic path
      await refetch();
    })();
    return () => { mountedRef.current = false; };
  }, [refetch]);

  return { user, loading, refetch } as const;
}
