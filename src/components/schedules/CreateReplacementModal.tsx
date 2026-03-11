import React from 'react';

export default function CreateReplacementModal({
  visible,
  onClose,
  onCreate,
  loading = false,
  horaries = [],
  initialHoraryId,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (p: { horaryId: number; name: string; last_name: string }) => void;
  loading?: boolean;
  horaries?: any[];
  initialHoraryId?: number;
}) {
  const [horaryId, setHoraryId] = React.useState<number | undefined>(initialHoraryId);
  const [name, setName] = React.useState<string>('');
  const [lastName, setLastName] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [hoverCancel, setHoverCancel] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setError(null);
      setName('');
      setLastName('');
      if (initialHoraryId) setHoraryId(initialHoraryId);
      else if (horaries && horaries.length) setHoraryId(horaries[0].id);
    }
  }, [visible, initialHoraryId, horaries]);

  if (!visible) return null;

  const validateAndCreate = () => {
    setError(null);
    if (!horaryId) {
      setError('Seleccione un horario padre');
      return;
    }
    if (!name || !lastName) {
      setError('Ingrese nombre y apellido del reemplazo');
      return;
    }
    if (loading) return;
    onCreate({ horaryId, name: name.trim(), last_name: lastName.trim() });
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
        <h3 style={{ marginTop: 0 }}>Crear reemplazo</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13, gridColumn: 'span 2' }}>
            Horario padre
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

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
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

          <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
            Apellido
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
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
              background: hoverCreate ? '#2b8a3e' : '#32a84b',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 160ms ease',
              transform: hoverCreate ? 'translateY(-3px)' : 'none',
              boxShadow: hoverCreate ? '0 8px 20px rgba(50,168,75,0.24)' : 'none',
            }}
          >
            {loading ? 'Creando...' : 'Crear reemplazo'}
          </button>
        </div>
      </div>
    </div>
  );
}
