import React from 'react';
import { listWorkerHoraries, createWorkerHorary } from '../../api/workerHorariesApi';
import type { HoraryParams } from '../../api/workerHorariesApi';
import CalendarGrid from '../../components/schedules/CalendarGrid';
import Navbar from '../../components/navbar/Navbar';
import CreateScheduleModal from '../../components/schedules/CreateScheduleModal';

export default function Schedules() {
  const [horaries, setHoraries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);

  // modal initial values when opened from calendar click
  const [modalInitialDayId, setModalInitialDayId] = React.useState<number | undefined>(undefined);
  const [modalInitialStart, setModalInitialStart] = React.useState<string | undefined>(undefined);
  const [modalInitialEnd, setModalInitialEnd] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setLoading(true);
    listWorkerHoraries().then((r) => {
      setHoraries(r.data || []);
    }).catch((e) => {
      console.error('failed to load horaries', e);
      setHoraries([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = (p: { day: string; day_id?: number; start: string; end: string }) => {
    setCreating(true);
    // prepare payload expected by backend (only permitted fields)
    const payload: HoraryParams = {
      start_time: p.start,
      end_time: p.end,
    };

    if (p.day_id) payload.day_id = p.day_id;

    createWorkerHorary(payload).then((res) => {
      // assume API returns created object in res.data
      const created = res.data;
      setHoraries((s) => [...s, created]);
      setShowCreate(false);
    }).catch((e: any) => {
      console.error('failed to create horary', e);
      // show server validation message if available
      const serverMessage = e?.response?.data || e?.response?.statusText;
      if (serverMessage) {
        alert('Error al crear horario: ' + JSON.stringify(serverMessage));
      } else {
        // fallback: add local item so user sees it; mark with temp id
        const newItem = { id: Date.now(), day: p.day, day_id: p.day_id, start: p.start, end: p.end, _pending: true };
        setHoraries((s) => [...s, newItem]);
      }
      setShowCreate(false);
    }).finally(() => setCreating(false));
  };

  // handler for clicks coming from CalendarGrid slots
  const handleGridCreate = (data: { day_id: number; start_time: string; end_time?: string }) => {
    setModalInitialDayId(data.day_id);
    setModalInitialStart(data.start_time);
    setModalInitialEnd(data.end_time);
    setShowCreate(true);
  };

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
                    onClick={() => setShowCreate(true)}
                    onMouseEnter={() => setHoverCreate(true)}
                    onMouseLeave={() => setHoverCreate(false)}
                    style={{
                      background: hoverCreate ? '#105bd6' : '#1677ff',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      transform: hoverCreate ? 'translateY(-3px)' : 'none',
                      boxShadow: hoverCreate ? '0 8px 20px rgba(16,91,214,0.24)' : 'none',
                    }}
                  >
                    Crear horario
                  </button>
                </div>
              </div>
              <CalendarGrid weekStart={new Date().toISOString().slice(0,10)} horaries={horaries} onCreate={handleGridCreate} />
            </>
          )}
        </div>
      </main>
      <CreateScheduleModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        loading={creating}
        initialDayId={modalInitialDayId}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
      />
    </div>
  );
}
