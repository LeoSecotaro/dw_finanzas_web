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

  React.useEffect(() => {
    let mounted = true;
    // always try to refresh in background (but don't block initial paint)
    (async () => {
      setLoading(true);
      try {
        const resp = await getCurrentUser();
        if (!mounted) return;
        const u = resp?.data ?? null;
        setUser(u);
        try { sessionStorage.setItem('current_user', JSON.stringify(u)); } catch (e) { /* ignore */ }
      } catch (e) {
        if (!mounted) return;
        // if unauthorized or error, clear cached user
        setUser(null);
        try { sessionStorage.removeItem('current_user'); } catch (er) { /* ignore */ }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { user, loading } as const;
}
