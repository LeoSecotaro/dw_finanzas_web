import React from 'react';
import styles from './UploadModal.module.css';
import { API_CONFIG } from '../../config/api';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // endpoint relative to API client base (default '/raw_files')
  endpoint?: string;
  // form field name for the file (defaults to 'raw_file[file]')
  fieldName?: string;
  // optional callback when upload succeeds
  onUploaded?: () => void;
};

export default function UploadModal({ isOpen, onClose, endpoint = '/raw_files', fieldName = 'raw_file[file]', onUploaded }: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Seleccioná un archivo', { autoClose: 1700 });
      return;
    }

    const form = new FormData();
    form.append(fieldName, file);

    setLoading(true);
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if (!res.ok) {
        console.error('upload failed', data || res.statusText);
        const serverMessage = data && (data.error || data.message || JSON.stringify(data)) || res.statusText || 'Error al subir archivo';
        toast.error(serverMessage, { autoClose: 4000 });
      } else {
        toast.success('Archivo subido correctamente', { autoClose: 1500 });
        if (onUploaded && typeof onUploaded === 'function') {
          try { onUploaded(); } catch (e) { /* ignore */ }
        }
        onClose();
      }
    } catch (err: any) {
      console.error('upload failed', err);
      toast.error(err?.message || 'Error al subir archivo', { autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Subir archivos</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.body}>
          <p>Subí archivos CSV/Excel o PDF con datos para generar gráficos.</p>
          <input ref={fileRef} type="file" accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.pdf,application/pdf" className={styles.input} />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={styles.submitButton} onClick={handleUpload} disabled={loading}>{loading ? 'Subiendo...' : 'Subir'}</button>
        </div>
      </div>
    </div>
  );
}
