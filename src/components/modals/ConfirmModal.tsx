import React, { useState } from 'react';

export default function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  loading = false,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
}: {
  visible: boolean;
  title?: string;
  message?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
}) {
  const [hoverCancel, setHoverCancel] = useState(false);
  const [hoverConfirm, setHoverConfirm] = useState(false);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1600 }}>
      <div style={{ width: 420, background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 20, boxSizing: 'border-box' }}>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        {message && <div>{message}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button
            onClick={onCancel}
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
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            onMouseEnter={() => setHoverConfirm(true)}
            onMouseLeave={() => setHoverConfirm(false)}
            style={{
              background: hoverConfirm ? '#a33b3b' : '#d64545',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 160ms ease',
              transform: hoverConfirm ? 'translateY(-3px)' : 'none',
              boxShadow: hoverConfirm ? '0 8px 20px rgba(166,59,59,0.24)' : 'none',
            }}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
