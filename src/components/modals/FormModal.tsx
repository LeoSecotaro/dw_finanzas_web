import React from 'react';

type Field = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  readOnly?: boolean;
  type?: string; // text, number, email, etc.
};

type FormModalProps = {
  isOpen: boolean;
  title?: string;
  fields: Field[];
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export default function FormModal({ isOpen, title = 'Editar', fields, onCancel, onSubmit, submitLabel = 'Guardar' }: FormModalProps) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div onClick={handleBackdrop} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20010 }}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ width: 720, maxWidth: '95%', background: '#fff', borderRadius: 8, padding: 18, boxSizing: 'border-box', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', position: 'relative' }}>
        <button
          onClick={onCancel}
          aria-label="Cerrar"
          onMouseEnter={() => setHovered('close')}
          onMouseLeave={() => setHovered(null)}
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 18,
            color: '#333',
            transform: hovered === 'close' ? 'translateY(-4px)' : 'none',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            boxShadow: hovered === 'close' ? '0 8px 18px rgba(0,0,0,0.18)' : 'none',
            borderRadius: 6,
            padding: 4,
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#000' }}>{title}</h3>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {fields.map((f, idx) => (
            <div key={idx}>
              <label style={{ display: 'block', fontSize: 13, color: '#333', marginBottom: 6 }}>{f.label}</label>
              <input
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                readOnly={f.readOnly}
                type={f.type || 'text'}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box', background: f.readOnly ? '#f5f5f5' : '#fff', color: '#111' }}
              />
              {f.error && <div style={{ color: '#d32f2f', marginTop: 6, fontSize: 13 }}>{f.error}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={onCancel}
            onMouseEnter={() => setHovered('cancel')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#e0e0e0',
              cursor: 'pointer',
              color: '#000',
              transform: hovered === 'cancel' ? 'translateY(-3px)' : 'none',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
              boxShadow: hovered === 'cancel' ? '0 8px 18px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            Cancelar
          </button>

          <button
            onClick={onSubmit}
            onMouseEnter={() => setHovered('submit')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: '#1976d2',
              color: '#fff',
              cursor: 'pointer',
              transform: hovered === 'submit' ? 'translateY(-3px)' : 'none',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
              boxShadow: hovered === 'submit' ? '0 8px 18px rgba(25,118,210,0.18)' : 'none',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
