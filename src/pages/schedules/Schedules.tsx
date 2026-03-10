import React from 'react';
import { listWorkerHoraries } from '../../api/workerHorariesApi';
import CalendarGrid from '../../components/schedules/CalendarGrid';
import Navbar from '../../components/navbar/Navbar';

export default function Schedules() {
  const [horaries, setHoraries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    listWorkerHoraries().then((r) => {
      setHoraries(r.data || []);
    }).catch((e) => {
      console.error('failed to load horaries', e);
      setHoraries([]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Horarios" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1600, width: '100%', padding: 24 }}>
          {loading ? <div>Cargando...</div> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Calendario</h3>
                <div>
                  <button
                    onClick={() => alert('editar/crear horarios (pendiente)')}
                    style={{ background: '#1677ff', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Crear horario
                  </button>
                </div>
              </div>
              <CalendarGrid weekStart={new Date().toISOString().slice(0,10)} horaries={horaries} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
