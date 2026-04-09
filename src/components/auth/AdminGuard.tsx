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

function extractPermissions(obj: any): string[] {
  if (!obj) return [];
  const u = obj.user || obj.data || obj;
  if (!u) return [];
  // Common keys: permissions, assigned_permissions, role_permissions
  const tryGet = (arr: any) => {
    if (!Array.isArray(arr)) return [] as string[];
    return arr.map((p: any) => (typeof p === 'string' ? p : p.name ?? p.permission_name ?? p.title ?? '')).filter(Boolean).map((x: any) => String(x).toLowerCase());
  };

  let perms: string[] = [];
  if (Array.isArray(u.permissions)) perms = perms.concat(tryGet(u.permissions));
  if (Array.isArray(u.assigned_permissions)) perms = perms.concat(tryGet(u.assigned_permissions));
  if (Array.isArray(u.role_permissions)) perms = perms.concat(tryGet(u.role_permissions));
  if (u.user && Array.isArray(u.user.permissions)) perms = perms.concat(tryGet(u.user.permissions));

  // fallback: scan keys for arrays that look like permissions
  for (const k of Object.keys(u)) {
    if (/perm/i.test(k) && Array.isArray(u[k])) perms = perms.concat(tryGet(u[k]));
  }

  return Array.from(new Set(perms));
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

      const perms = extractPermissions(resp.data);
      // allow if user has 'system.manage' permission or any permission under 'system.' namespace
      const hasSystemManage = perms.includes('system.manage');
      const hasSystemNamespace = perms.some(p => typeof p === 'string' && p.startsWith('system.'));

      const allowed = hasSystemManage || hasSystemNamespace;
      setState(allowed ? 'allowed' : 'denied');
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
