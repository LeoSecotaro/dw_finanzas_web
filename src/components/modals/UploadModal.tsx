import React from 'react';
import styles from './UploadModal.module.css';
import apiClient from '../../api/apiClient';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UploadModal({ isOpen, onClose }: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Seleccioná un archivo');
      return;
    }

    const form = new FormData();
    form.append('raw_file[file]', file);

    setLoading(true);
    try {
      await apiClient.post('/raw_files', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Archivo subido correctamente');
      onClose();
    } catch (err) {
      console.error('upload failed', err);
      toast.error('Error al subir archivo');
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
