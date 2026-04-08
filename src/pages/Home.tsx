import React from 'react';
import Card from '../components/cards/Card';
import { FaRegMoneyBillAlt, FaClock, FaTools } from 'react-icons/fa';
import Navbar from '../components/navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import useCurrentUser from '../hooks/useCurrentUser';
import { getCurrentUser } from '../api/usersApi';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();
  const [roles, setRoles] = React.useState<string[] | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getCurrentUser();
        if (!mounted) return;
        const u = resp && resp.data ? resp.data : resp;
        const rlist: string[] = [];
        if (u) {
          if (Array.isArray(u.roles)) rlist.push(...u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || String(r))));
          else if (u.role) rlist.push(String(u.role));
          else if (u.current_role) rlist.push(String(u.current_role));
        }
        setRoles(rlist.map(rr => String(rr).toLowerCase()));
      } catch (e) {
        setRoles(null);
      } finally {
        if (mounted) setUserLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const userIsAdmin = React.useMemo<boolean>(() => {
    if (!user || !Array.isArray(user.roles)) return false;
    const normalized: string[] = user.roles.map((r: any) => (typeof r === 'string' ? r : (r && (r.name || r.role)) || '')).filter(Boolean).map((x: any) => String(x).toLowerCase());
    return normalized.includes('admin');
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar title="Home" />
      <div style={{ maxWidth: 1200, padding: 40, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {(!userLoading && roles && !roles.includes('colaborador')) && (
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
            {(!userLoading && roles && roles.includes('admin')) && (
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
