import React from 'react';
import styles from './CreateChartModal.module.css';
import { getCompare, getCompareMulti } from '../../api/reportsApi';
import apiClient from '../../api/apiClient';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: any) => void;
};

export default function CreateChartModal({ isOpen, onClose, onCreate }: Props) {
  const [startDate, setStartDate] = React.useState('2025-01-01');
  const [endDate, setEndDate] = React.useState('2025-12-31');
  const [obraSocials, setObraSocials] = React.useState<Array<any>>([]);
  const [selectedObra, setSelectedObra] = React.useState<string | null>(null);
  const [metrics, setMetrics] = React.useState<Record<string, boolean>>({ produccion: false, prestacion: false, facturacion: false, liquidacion: false });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    // fetch obra socials
    apiClient.get('/obra_socials').then((r) => setObraSocials(r.data)).catch(() => setObraSocials([]));
  }, [isOpen]);

  const toggleMetric = (key: string) => {
    setMetrics((m) => ({ ...m, [key]: !m[key] }));
  };

  const handleCreate = async () => {
    // Build params
    const selectedMetrics = Object.keys(metrics).filter((k) => metrics[k]);
    if (selectedMetrics.length === 0) {
      alert('Seleccioná al menos una métrica');
      return;
    }

    // Backend expects different param names depending on the route.
    // Map local values -> backend: from/to, obra (name), group_by, and either left/right or sources.
    const from = startDate;
    const to = endDate;
    // If selectedObra is an id, try to resolve the display name from obraSocials
    const obraName = selectedObra ? (obraSocials.find((o: any) => String(o.id) === String(selectedObra))?.name || selectedObra) : undefined;

    let resp;
    try {
      if (selectedMetrics.length === 2) {
        // Use compare with left and right
        const params: any = { left: selectedMetrics[0], right: selectedMetrics[1], from, to, group_by: 'month' };
        if (obraName) params.obra = obraName;
        resp = await getCompare(params);
      } else {
        // Use compare_multi for 1 or more sources
        const params: any = { sources: selectedMetrics.join(','), from, to, group_by: 'month' };
        if (obraName) params.obra = obraName;
        resp = await getCompareMulti(params);
      }

      // resp.data expected to be { labels, datasets }
      onCreate({ id: Date.now().toString(), title: selectedMetrics.join(' vs '), data: resp.data });
      onClose();
    } catch (err) {
      console.error('error fetching compare', err);
      alert('Error al solicitar datos');
    } finally {
      setLoading(true);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Crear gráfico</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.body}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <label>
              Desde
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              Hasta
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Obra social</label>
            <select value={selectedObra || ''} onChange={(e) => setSelectedObra(e.target.value)}>
              <option value="">Todas</option>
              {obraSocials.map((o: any) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => toggleMetric('produccion')} className={metrics.produccion ? styles.metricActive : styles.metricButton}>Producción</button>
            <button type="button" onClick={() => toggleMetric('prestacion')} className={metrics.prestacion ? styles.metricActive : styles.metricButton}>Prestación</button>
            <button type="button" onClick={() => toggleMetric('facturacion')} className={metrics.facturacion ? styles.metricActive : styles.metricButton}>Facturación</button>
            <button type="button" onClick={() => toggleMetric('liquidacion')} className={metrics.liquidacion ? styles.metricActive : styles.metricButton}>Liquidación</button>
          </div>

        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
          <button className={styles.submitButton} onClick={handleCreate} disabled={loading}>{loading ? 'Cargando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}
