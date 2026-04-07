import React from 'react';
import { toast } from 'react-toastify';
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
  const [selectedObra, setSelectedObra] = React.useState<string>('');
  const [obrasLoading, setObrasLoading] = React.useState<boolean>(false);
  const [metrics, setMetrics] = React.useState<Record<string, boolean>>({ produccion: false, prestacion: false, facturacion: false, liquidacion: false });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    // fetch obra socials
    setObrasLoading(true);
    (async () => {
      const endpoints = ['/obra_socials', '/obra_socials.json', '/api/obra_socials', '/obra_socials/list'];
      let finalList: any[] = [];
      let lastErr: any = null;
      for (const ep of endpoints) {
        try {
          const r = await apiClient.get(ep);
          console.debug('GET', ep, 'response', r);
          if (r.status === 401 || r.status === 403) {
            lastErr = { status: r.status };
            break; // auth issue, stop trying
          }
          const d = r && r.data ? r.data : null;
          let list: any[] = [];
          if (Array.isArray(d)) list = d;
          else if (d && Array.isArray(d.obra_socials)) list = d.obra_socials;
          else if (d && Array.isArray(d.data)) list = d.data;
          else if (d && Array.isArray(d.items)) list = d.items;
          else if (d && typeof d === 'object') {
            const vals = Object.values(d);
            if (vals.length > 0 && vals.every(v => v && typeof v === 'object' && ('id' in v || 'name' in v))) {
              list = vals as any[];
            } else {
              const nested = vals.find(v => Array.isArray(v));
              if (Array.isArray(nested)) list = nested as any[];
            }
          }
          if (list && list.length > 0) {
            finalList = list;
            break;
          }
        } catch (err) {
          console.error('fetch', ep, 'failed', err);
          lastErr = err;
          continue;
        }
      }
      if (lastErr && lastErr.status && (lastErr.status === 401 || lastErr.status === 403)) {
        console.warn('obra_socials request blocked by auth (401/403)');
        setObraSocials([]);
      } else {
        console.debug('Final obra socials list', finalList);
        setObraSocials(finalList);
      }
      setObrasLoading(false);
    })();
  }, [isOpen]);

  const toggleMetric = (key: string) => {
    setMetrics((m) => ({ ...m, [key]: !m[key] }));
  };

  const handleCreate = async () => {
    // Build params
    const selectedMetrics = Object.keys(metrics).filter((k) => metrics[k]);
    if (selectedMetrics.length === 0) {
      toast.error('Seleccioná al menos una métrica', { autoClose: 1500 });
      return;
    }

    // Validate dates
    if (!startDate || !endDate) {
      toast.error('Seleccioná una fecha desde y hasta', { autoClose: 1500 });
      return;
    }
    const fromD = new Date(startDate);
    const toD = new Date(endDate);
    if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) {
      toast.error('Seleccioná fechas válidas', { autoClose: 1500 });
      return;
    }
    if (fromD > toD) {
      toast.error('La fecha "Desde" debe ser anterior a "Hasta"', { autoClose: 1800 });
      return;
    }

    setLoading(true);

    // Backend expects different param names depending on the route.
    // Map local values -> backend: from/to, obra (name), group_by, and either left/right or sources.
    const from = startDate;
    const to = endDate;
    // If selectedObra is an id, try to resolve the display name from obraSocials
    const obraName = selectedObra
      ? (obraSocials.find((o: any) => String(o?.id ?? o?.value ?? o?.name ?? o) === String(selectedObra))?.name || selectedObra)
      : undefined;

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
            <select value={selectedObra} onChange={(e) => setSelectedObra(e.target.value)} disabled={obrasLoading}>
              <option value="">Todas</option>
              {obrasLoading && <option value="">Cargando...</option>}
              {obraSocials.map((o: any) => {
                const val = String(o?.id ?? o?.value ?? o?.name ?? o);
                const label = o?.name ?? o?.label ?? String(o);
                return <option key={val} value={val}>{label}</option>;
              })}
            </select>
            {!obrasLoading && obraSocials.length === 0 && (
              <div style={{ color: '#777', marginTop: 8 }}>No hay obras sociales disponibles.</div>
            )}
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
