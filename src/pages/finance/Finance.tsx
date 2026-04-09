import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCurrentUser from '../../hooks/useCurrentUser';
import Navbar from '../../components/navbar/Navbar';
import UploadModal from '../../components/modals/UploadModal';
import CreateChartModal from '../../components/modals/CreateChartModal';
import CardsContainer from '../../components/graphicsCards/graphicsCards';
import styles from './Finance.module.css';

export default function Finance() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  React.useEffect(() => {
    // wait until user is loaded from hook
    if (loading) return;
    try {
      const u = user?.user ?? user?.data ?? user ?? null;
      // collect permissions from common places
      const tryGet = (arr: any) => Array.isArray(arr) ? arr.map((p: any) => (typeof p === 'string' ? p : p.name ?? p.permission_name ?? p.title ?? '')).filter(Boolean).map((x: any) => String(x).toLowerCase()) : [] as string[];
      let perms: string[] = [];
      if (u) {
        perms = perms.concat(tryGet(u.permissions));
        perms = perms.concat(tryGet(u.assigned_permissions));
        perms = perms.concat(tryGet(u.role_permissions));
        if (u.user && Array.isArray(u.user.permissions)) perms = perms.concat(tryGet(u.user.permissions));
        for (const k of Object.keys(u)) {
          if (/perm/i.test(k) && Array.isArray(u[k])) perms = perms.concat(tryGet(u[k]));
        }
      }
      const lowered = Array.from(new Set(perms.map(p => String(p).toLowerCase())));
      const allowed = lowered.some(p => p.startsWith('finanzas')) || lowered.includes('system.manage');
      if (!allowed) {
        toast.error('No estás autorizado para acceder a Finanzas', { autoClose: 1500 });
        navigate('/home', { replace: true });
      }
    } catch (e) {
      toast.error('No estás autorizado para acceder a Finanzas', { autoClose: 1500 });
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cards, setCards] = React.useState<Array<any>>([]);

  const handleCreate = (config: any) => {
    console.log('Crear tarjeta con config', config);
    setCards((c) => [config, ...c]);
  };

  const handleRemove = (id: string) => setCards((c) => c.filter((x) => x.id !== id));

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Finanzas" />
      <main style={{ paddingTop: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1200, width: '100%', padding: 24, textAlign: 'center' }}>


          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
            <button onClick={() => setUploadOpen(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
              Subir archivos
            </button>
            <button onClick={() => setCreateOpen(true)} className={`${styles.btn} ${styles.btnPrimary}`}>
              Crear gráfico
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: 24, borderRadius: 8, minHeight: 240 }}>
            {cards.length === 0 ? (
              <p style={{ color: '#ddd' }}>Acá se van a agregar las visualizaciones.</p>
            ) : (
              <CardsContainer cards={cards} onRemove={handleRemove} />
            )}
          </div>
        </div>
      </main>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CreateChartModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
