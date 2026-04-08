import React from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { toast } from 'react-toastify';

// Use the canonical endpoint provided by backend. Avoid trying many fallbacks to reduce 404 noise.
const COMMON_ENDPOINTS = ['/user/me'];

async function fetchFirstUser(endpointList: string[]) {
  const ep = endpointList[0];
  try {
    const resp = await apiClient.get(ep);
    if (resp && resp.status >= 200 && resp.status < 300) return { endpoint: ep, data: resp.data };
    if (resp && (resp.status === 401 || resp.status === 403)) return { endpoint: ep, data: null, denied: true } as any;
    return null;
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401 || status === 403) return { endpoint: ep, data: null, denied: true } as any;
    // otherwise return null quietly (no console logs)
    return null;
  }
}

function extractRoles(obj: any): string[] {
  if (!obj) return [];
  // obj may already be the user object, or wrapped: { data: {...} }
  const u = obj.user || obj.data || obj;
  if (!u) return [];
  if (Array.isArray(u.roles)) return u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || r.role || '')).filter(Boolean);
  if (u.role) return [String(u.role)];
  if (u.current_role) return [String(u.current_role)];
  if (u.role_name) return [String(u.role_name)];
  if (u.type) return [String(u.type)];
  // try nested structures
  if (u.user && Array.isArray(u.user.roles)) return u.user.roles.map((r: any) => r.name || r);
  // fallback: scan keys
  for (const k of Object.keys(u)) {
    if (typeof u[k] === 'string' && /role/i.test(k)) return [String(u[k])];
  }
  return [];
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = React.useState<'loading' | 'allowed' | 'denied'>('loading');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const resp = await fetchFirstUser(COMMON_ENDPOINTS);
      if (!mounted) return;
      if (!resp) {
        setState('denied');
        return;
      }
      const roles = extractRoles(resp.data);
      const isAdmin = roles.map(r => String(r).toLowerCase()).includes('admin');
      setState(isAdmin ? 'allowed' : 'denied');
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (state === 'denied') {
      try {
        toast.error('No estás autorizado para acceder a esta sección', { autoClose: 1500 });
      } catch (e) { /* ignore toast errors */ }
      navigate('/home', { replace: true });
    }
  }, [state, navigate]);

  if (state === 'loading') {
    return (
      <div style={{ padding: 24 }}>
        <h3>Comprobando permisos...</h3>
      </div>
    );
  }

  if (state === 'allowed') return <>{children}</>;
  return null;
}
