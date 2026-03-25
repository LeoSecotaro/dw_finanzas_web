import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listConsultorios } from '../../api/consultoriosApi';

export default function ConsultoriosAdminPage() {
  const [consultorios, setConsultorios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listConsultorios()
      .then((resp) => {
        if (cancelled) return;
        let data: any = resp.data;
        if (data && data.consultorios) data = data.consultorios;
        if (data && data.data) data = data.data;
        if (!Array.isArray(data)) {
          const arr = Object.values(data).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) data = arr;
        }
        setConsultorios(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('failed to load consultorios', err);
        if (cancelled) return;
        setError('No se pudieron cargar los consultorios');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = React.useMemo(() => {
    if (!consultorios || consultorios.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'direccion', label: 'Dirección' }];
    const first = consultorios[0];
    const keys = Object.keys(first);
    return keys.map((k) => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
  }, [consultorios]);

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Consultorios</h2>
        </div>

        {loading && <p>Cargando consultorios...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <DataTable columns={columns} data={consultorios} />
        )}
      </div>
    </AdminLayout>
  );
}
