import React from 'react';
import { listDays } from '../../api/daysApi';
import type { DayItem } from '../../api/daysApi';
import { listConsultorios } from '../../api/consultoriosApi';

type Payload = {
  day: string;
  day_id?: number;
  consultorio_id?: number;
  start: string; // HH:MM
  end: string;   // HH:MM
  title?: string; // optional title
};

export default function CreateScheduleModal({
  visible,
  onClose,
  onCreate,
  loading = false,
  initialDayId,
  initialStart,
  initialEnd,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (p: Payload) => void;
  loading?: boolean;
  initialDayId?: number;
  initialStart?: string;
  initialEnd?: string;
}) {
  const defaultDays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const [days, setDays] = React.useState<DayItem[]>(defaultDays.map((d, i) => ({ id: i + 1, short_name: d })));
  const [dayId, setDayId] = React.useState<number | undefined>(days[0]?.id);
  const [start, setStart] = React.useState<string>('06:00');
  const [end, setEnd] = React.useState<string>('14:00');
  const [title, setTitle] = React.useState<string>('');
  const [consultorios, setConsultorios] = React.useState<any[]>([]);
  const [consultorioId, setConsultorioId] = React.useState<number | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const [hoverCancel, setHoverCancel] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      // if initial values provided, use them, otherwise defaults
      setStart(initialStart || '06:00');
      setEnd(initialEnd || '14:00');
      setTitle('');
      setError(null);
      // fetch real days from backend
      listDays().then((r) => {
        const items: DayItem[] = r.data || [];
        if (items && items.length) {
          setDays(items);
          // prefer initialDayId if provided and exists in items
          if (initialDayId && items.find(d => d.id === initialDayId)) {
            setDayId(initialDayId);
          } else {
            setDayId(items[0].id);
          }
        }
      }).catch((e) => {
        console.warn('failed to load days, using local defaults', e);
        // if no remote days and initialDayId provided, keep it
        if (initialDayId) setDayId(initialDayId);
      });

      // fetch consultorios for select
      listConsultorios().then((r) => {
        const items = r.data || [];
        setConsultorios(items);
        if (items && items.length) {
          setConsultorioId(items[0].id);
        }
      }).catch((e) => {
        console.warn('failed to load consultorios', e);
      });
     }
   }, [visible, initialDayId, initialStart, initialEnd]);

  if (!visible) return null;

  const validateAndCreate = () => {
    setError(null);
    if (!start || !end) {
      setError('Debe seleccionar hora de inicio y fin');
      return;
    }
    if (start >= end) {
      setError('La hora de inicio debe ser anterior a la de fin');
      return;
    }
    if (loading) return; // prevent duplicate
    const selected = days.find(d => d.id === dayId);
    onCreate({ day: selected?.short_name || selected?.name || '', day_id: dayId, consultorio_id: consultorioId, start, end, title: title ? title.trim() : undefined });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div style={{ width: 420, background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 20, boxSizing: 'border-box', position: 'relative' }}>
        {/* close X button top-right */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
        <h3 style={{ marginTop: 0 }}>Crear horario</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
            Título (opcional)
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Jornada mañana" style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
            Consultorio
            <select value={consultorioId} onChange={(e) => setConsultorioId(e.target.value ? Number(e.target.value) : undefined)} style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }}>
              {consultorios.map(c => <option key={c.id} value={c.id}>{c.name || c.nombre || `Consultorio ${c.id}`}</option>)}
            </select>
          </label>
           <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
             Día
             <select value={dayId} onChange={(e) => setDayId(Number(e.target.value))} style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }}>
               {days.map(d => <option key={d.id} value={d.id}>{d.short_name || d.name || d.id}</option>)}
             </select>
           </label>

           <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
             Inicio
             <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }} />
           </label>

           <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
             Fin
             <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }} />
           </label>
         </div>

         {error && <div style={{ color: '#ff6b6b', marginTop: 12 }}>{error}</div>}

         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
           <button
             onClick={onClose}
             disabled={loading}
             onMouseEnter={() => setHoverCancel(true)}
             onMouseLeave={() => setHoverCancel(false)}
             style={{
               // hover uses darker gray instead of blue
               background: hoverCancel ? '#2a2a2a' : 'transparent',
               color: hoverCancel ? '#fff' : '#ddd',
               border: '1px solid #333',
               padding: '8px 12px',
               borderRadius: 6,
               cursor: loading ? 'not-allowed' : 'pointer',
               transition: 'all 160ms ease',
               transform: hoverCancel ? 'translateY(-3px)' : 'none',
               boxShadow: hoverCancel ? '0 8px 20px rgba(0,0,0,0.28)' : 'none',
             }}
           >
             Cancelar
           </button>

           <button
             onClick={validateAndCreate}
             disabled={loading}
             onMouseEnter={() => setHoverCreate(true)}
             onMouseLeave={() => setHoverCreate(false)}
             style={{
               background: hoverCreate ? '#105bd6' : '#1677ff',
               color: '#fff',
               border: 'none',
               padding: '8px 12px',
               borderRadius: 6,
               cursor: loading ? 'not-allowed' : 'pointer',
               transition: 'all 160ms ease',
               transform: hoverCreate ? 'translateY(-3px)' : 'none',
               boxShadow: hoverCreate ? '0 8px 20px rgba(16,91,214,0.24)' : 'none',
             }}
           >
             {loading ? 'Creando...' : 'Crear'}
           </button>
         </div>
       </div>
     </div>
   );
 }
