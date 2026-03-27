import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listObrasSociales, createObraSocial, updateObraSocial, deleteObraSocial } from '../../api/obrasSocialesApi';
import { FaPen, FaTimes, FaPlus } from 'react-icons/fa';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ObrasSocialesAdmin() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  // pagination/search state
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // create form state
  const [createName, setCreateName] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = { page, per_page: perPage };
        if (q) params.q = q;
        const r = await listObrasSociales(params);
        if (cancelled) return;
        // normalize many possible response shapes (Rails, will_paginate, meta, direct array, etc.)
        let data: any = r.data;
        if (data && data.obras_socials) data = data.obras_socials;
        if (data && data.data) data = data.data;
        if (!Array.isArray(data)) {
          const arr = Object.values(data || {}).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) data = arr;
        }
        const list = Array.isArray(data) ? data : [];
        setItems(list);

        // try common pagination/meta shapes
        const meta = (r.data && (r.data.meta || {})) || {};
        setTotalPages(r.data?.total_pages || meta.total_pages || 1);
        setPage(r.data?.current_page || meta.current_page || page);
        setTotalCount(r.data?.total_count || meta.total_count || (list.length || 0));
      } catch (e) {
        console.error('failed to load obras sociales', e);
        if (cancelled) return;
        setError('No se pudieron cargar obras sociales');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [q, page, perPage]);

  const columns = React.useMemo(() => {
    if (!items || items.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: '__actions', label: '' }];
    const first = items[0];
    const exclude = ['created_at', 'updated_at'];
    const keys = Object.keys(first).filter(k => !exclude.includes(k));
    const cols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
    return cols.concat([{ key: '__actions', label: '' }]);
  }, [items]);

  const renderCell = (row: any, key: string) => {
    if (key === '__actions') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setEditing(row)} style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaPen /></button>
          <button onClick={() => setDeleting(row)} style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaTimes /></button>
        </div>
      );
    }
    const val = row?.[key];
    if (Array.isArray(val) || (val && typeof val === 'object')) return <span style={{ color: '#666' }}>—</span>;
    return undefined;
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = { name: editing.name };
      const resp = await updateObraSocial(editing.id, payload);
      setItems(prev => prev.map(i => i.id === editing.id ? (resp.data && resp.data.obra_social) || { ...i, ...payload } : i));
      setEditing(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo editar'); } finally { setSaving(false); }
  };

  const handleCreate = () => setCreating(true);
  const handleCreateCancel = () => { setCreating(false); setCreateName(''); };
  const handleCreateSubmit = async () => {
    setSaving(true);
    try {
      const payload = { name: createName };
      const resp = await createObraSocial(payload);
      let created = resp.data && (resp.data.obra_social || resp.data);
      if (!created) created = { id: Math.max(0, ...items.map(i => i.id || 0)) + 1, ...payload };
      setItems(prev => [created, ...prev]);
      setCreating(false);
      setCreateName('');
      toast.success('Creado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo crear'); } finally { setSaving(false); }
  };

  const performDelete = async () => {
    if (!deleting) return; setSaving(true);
    try { await deleteObraSocial(deleting.id); setItems(prev => prev.filter(i => i.id !== deleting.id)); setDeleting(null); toast.success('Eliminado con éxito', { autoClose: 1000, position: 'top-right' }); } catch (err) { console.error(err); alert('No se pudo eliminar'); } finally { setSaving(false); }
  };

  // small styled pagination button
  function PageButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '6px 10px',
          background: disabled ? '#9bbefb' : '#1677ff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transform: 'none',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
        }}
        onMouseEnter={(e) => { if (!disabled) (e.currentTarget.style.transform = 'translateY(-4px)'); }}
        onMouseLeave={(e) => { (e.currentTarget.style.transform = 'none'); }}
      >
        {children}
      </button>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Obras sociales</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Buscar..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #333', background: '#2a2a2a', color: '#fff' }} />
            <button onClick={handleCreate} style={{ background: '#2e7d32', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}><FaPlus /> Crear</button>
          </div>
        </div>

        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <>
            <DataTable columns={columns} data={items} renderCell={renderCell} minWidth={900} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ color: '#666' }}>Mostrando {items.length} de {totalCount}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <PageButton disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</PageButton>
                <span>Página {page} / {totalPages}</span>
                <PageButton disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</PageButton>
                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ padding: 6 }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}

        <FormModal isOpen={!!editing} title="Editar Obra Social" fields={[{ label: 'ID', value: editing?.id?.toString() || '', onChange: () => {}, readOnly: true }, { label: 'Nombre', value: editing?.name || '', onChange: (v) => setEditing((prev:any) => ({ ...prev, name: v })), error: undefined }]} onCancel={() => setEditing(null)} onSubmit={handleEditSubmit} submitLabel={saving ? 'Guardando...' : 'Guardar'} />

        <FormModal isOpen={creating} title="Crear Obra Social" fields={[{ label: 'Nombre', value: createName, onChange: setCreateName, error: undefined }]} onCancel={handleCreateCancel} onSubmit={handleCreateSubmit} submitLabel={saving ? 'Creando...' : 'Crear'} />

        <ConfirmModal visible={!!deleting} title="Eliminar Obra Social" message={deleting ? `¿Eliminar ${deleting.id} — ${deleting.name || ''}?` : '¿Eliminar?'} onCancel={() => setDeleting(null)} onConfirm={performDelete} loading={saving} cancelLabel="Cancelar" confirmLabel="Eliminar" />

        <ToastContainer position="top-right" autoClose={1000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </AdminLayout>
  );
}
