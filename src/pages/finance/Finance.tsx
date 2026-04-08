import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCurrentUser } from '../../api/usersApi';
import Navbar from '../../components/navbar/Navbar';
import UploadModal from '../../components/modals/UploadModal';
import CreateChartModal from '../../components/modals/CreateChartModal';
import CardsContainer from '../../components/graphicsCards/graphicsCards';
import styles from './Finance.module.css';

export default function Finance() {
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getCurrentUser();
        if (!mounted) return;
        const u = resp && resp.data ? resp.data : resp;
        const roles: string[] = [];
        if (u) {
          if (Array.isArray(u.roles)) roles.push(...u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || String(r))));
          else if (u.role) roles.push(String(u.role));
          else if (u.current_role) roles.push(String(u.current_role));
        }
        const lowered = roles.map(r => String(r).toLowerCase());
        if (lowered.includes('colaborador')) {
          toast.error('No estás autorizado para acceder a Finanzas', { autoClose: 1500 });
          navigate('/home', { replace: true });
        }
      } catch (e) {
        // on error (not authenticated / other), block access as conservative default for finances
        try {
          toast.error('No estás autorizado para acceder a Finanzas', { autoClose: 1500 });
        } catch (err) {}
        if (mounted) navigate('/home', { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

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
