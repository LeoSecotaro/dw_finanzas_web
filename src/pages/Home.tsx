import React from 'react';
import Card from '../components/cards/Card';
import { FaRegMoneyBillAlt, FaClock, FaTools } from 'react-icons/fa';
import Navbar from '../components/navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  // derive roles from the user object exposed by the hook
  const userRoles = React.useMemo(() => {
    if (!user) return [] as string[];
    const u = user.user || user.data || user;
    if (!u) return [] as string[];
    if (Array.isArray(u.roles)) return u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || String(r))).filter(Boolean).map((x: any) => String(x).toLowerCase());
    if (u.role) return [String(u.role).toLowerCase()];
    if (u.current_role) return [String(u.current_role).toLowerCase()];
    return [] as string[];
  }, [user]);

  // derive permissions from the user object
  const userPermissions = React.useMemo(() => {
    if (!user) return [] as string[];
    const u = user.user || user.data || user;
    if (!u) return [] as string[];
    const tryGet = (arr: any) => Array.isArray(arr) ? arr.map((p: any) => (typeof p === 'string' ? p : p.name ?? p.permission_name ?? p.title ?? '')).filter(Boolean).map((x: any) => String(x).toLowerCase()) : [] as string[];
    if (Array.isArray(u.permissions)) return tryGet(u.permissions);
    if (Array.isArray(u.assigned_permissions)) return tryGet(u.assigned_permissions);
    if (Array.isArray(u.role_permissions)) return tryGet(u.role_permissions);
    if (u.user && Array.isArray(u.user.permissions)) return tryGet(u.user.permissions);
    for (const k of Object.keys(u)) {
      if (/perm/i.test(k) && Array.isArray(u[k])) return tryGet(u[k]);
    }
    return [] as string[];
  }, [user]);

  const userIsAdmin = React.useMemo<boolean>(() => userRoles.includes('admin'), [userRoles]);
  const userCanManageSystem = React.useMemo<boolean>(() => userIsAdmin || userPermissions.includes('system.manage'), [userIsAdmin, userPermissions]);
  const userCanSeeFinance = React.useMemo(() => userCanManageSystem || userPermissions.some(p => p.startsWith('finanzas')), [userCanManageSystem, userPermissions]);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar title="Home" />
      <div style={{ maxWidth: 1200, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {(!loading && userCanSeeFinance) && (
              <Card
                title="Finanzas"
                color="#2E7D32"
                icon={<FaRegMoneyBillAlt size={36} />}
                onClick={() => navigate('/finance')}
              />
            )}
            <Card
              title="Horarios"
              color="#1565C0"
              icon={<FaClock size={36} />}
              onClick={() => navigate('/horarios')}
            />
            {(userCanManageSystem) && (
              <Card
                title="Gestionar sistema"
                color="#d2b48c"
                icon={<FaTools size={36} />}
                onClick={() => navigate('/admin')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
