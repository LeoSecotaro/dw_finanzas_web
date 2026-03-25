import React from 'react';

export default function CreateFaltaModal({
  visible,
  onClose,
  onCreate,
  loading = false,
  horaries = [],
  initialHoraryId,
  weekStart,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (p: { horaryId: number; reason: string; occurrence_date?: string }) => void;
  loading?: boolean;
  horaries?: any[];
  initialHoraryId?: number;
  weekStart?: Date;
}) {
  const [horaryId, setHoraryId] = React.useState<number | undefined>(initialHoraryId);
  const [reason, setReason] = React.useState<string>('');
  const [occurrenceDate, setOccurrenceDate] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [hoverCancel, setHoverCancel] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setError(null);
      setReason('');
      if (initialHoraryId) setHoraryId(initialHoraryId);
      else if (horaries && horaries.length) setHoraryId(horaries[0].id);
      // default occurrence date: if we have weekStart and a selected horary with day_id, set that date
      if (weekStart) {
        const parent = (initialHoraryId && horaries && horaries.length) ? horaries.find(h => h.id === initialHoraryId) : null;
        if (parent && parent.day_id) {
          const ms = 24 * 60 * 60 * 1000;
          const dayIndex = (parent.day_id || 1) - 1; // day_id 1 => Monday
          const d = new Date(weekStart.getTime() + dayIndex * ms);
          setOccurrenceDate(d.toISOString().slice(0,10));
        } else if (weekStart) {
          setOccurrenceDate(weekStart.toISOString().slice(0,10));
        }
      }
    }
  }, [visible, initialHoraryId, horaries, weekStart]);

  if (!visible) return null;

  const validateAndCreate = () => {
    setError(null);
    if (!horaryId) {
      setError('Seleccione un horario');
      return;
    }
    if (!reason) {
      setError('Ingrese motivo de la falta');
      return;
    }
    if (loading) return;
    onCreate({ horaryId, reason: reason.trim(), occurrence_date: occurrenceDate || undefined });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
      <div style={{ width: 480, background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 20, boxSizing: 'border-box', position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
        <h3 style={{ marginTop: 0 }}>Crear falta</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
            Fecha de la falta
            <input type="date" value={occurrenceDate} onChange={(e) => setOccurrenceDate(e.target.value)} style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#2a2a2a', color: '#fff', border: '1px solid #333' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
            Horario
            <select
              value={horaryId}
              onChange={(e) => setHoraryId(Number(e.target.value))}
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 6,
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #333',
                width: '100%',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <option value={undefined as any}>-- seleccionar --</option>
              {horaries.map(h => (
                <option key={h.id} value={h.id}>{h.title || h.name || `${h.start || h.start_time} - ${h.end || h.end_time}`}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
            Motivo
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo"
              style={{
                marginTop: 6,
                padding: '8px 10px',
                borderRadius: 6,
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid #333',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
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
              background: hoverCreate ? '#b43f3f' : '#d64545',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 160ms ease',
              transform: hoverCreate ? 'translateY(-3px)' : 'none',
              boxShadow: hoverCreate ? '0 8px 20px rgba(180,63,63,0.24)' : 'none',
            }}
          >
            {loading ? 'Creando...' : 'Crear falta'}
          </button>
        </div>
      </div>
    </div>
  );
}
