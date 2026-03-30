import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listHorarios, updateHorario, deleteHorario } from '../../api/horariosApi';
import { FaPen, FaTimes, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HorariosAdmin() {
  const navigate = useNavigate();
  const [horarios, setHorarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  // server-side list controls
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = { page, per_page: perPage };
        if (q) params.q = q;
        const resp = await listHorarios(params);
        if (cancelled) return;
        let data: any = resp.data || {};
        if (data && data.horarios) data = data.horarios;
        if (data && data.data) data = data.data;
        if (!Array.isArray(data)) {
          const arr = Object.values(data || {}).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) data = arr;
        }
        const list = Array.isArray(data) ? data : [];
        setHorarios(list);

        const meta = (resp.data && (resp.data.meta || {})) || {};
        const headers = resp.headers || {};
        // header-based totals (common when using pagination gems that set headers)
        const headerTotal = headers['x-total-count'] ?? headers['x-total'] ?? headers['x-total_count'] ?? null;
        const headerTotalPages = headers['x-total-pages'] ?? headers['x-total-pages-count'] ?? headers['x-total_pages'] ?? null;

        const totalRaw = headerTotal ?? resp.data?.total_count ?? meta.total_count ?? resp.data?.total_entries ?? resp.data?.total ?? null;
        const totalNum = totalRaw != null && !Number.isNaN(Number(totalRaw)) ? Number(totalRaw) : null;
        const total = totalNum != null ? totalNum : (Array.isArray(resp.data) ? resp.data.length : (list.length || 0));

        const explicitPagesRaw = headerTotalPages ?? resp.data?.total_pages ?? meta.total_pages ?? resp.data?.pages ?? resp.data?.total_pages_count ?? null;
        const explicitPages = explicitPagesRaw != null && !Number.isNaN(Number(explicitPagesRaw)) ? Number(explicitPagesRaw) : null;

        // compute pages using the UI-selected perPage (avoid trusting server per-page headers)
        const pages = explicitPages != null ? explicitPages : (total ? Math.max(1, Math.ceil(total / perPage)) : 1);
        setTotalPages(pages);

        // prefer current_page if backend provided it (body or headers)
        const currentRaw = resp.data?.current_page ?? meta.current_page ?? resp.data?.page ?? headers['x-page'] ?? null;
        const current = currentRaw != null && !Number.isNaN(Number(currentRaw)) ? Number(currentRaw) : page;
        // clamp current to valid range
        const clamped = Math.min(Math.max(1, current), pages || 1);
        setPage(clamped);
        setTotalCount(total);
      } catch (err) {
        console.error('failed to load horarios', err);
        if (cancelled) return;
        setError('No se pudieron cargar los horarios');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [q, page, perPage]);

  const columns = React.useMemo(() => {
    if (!horarios || horarios.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: '__actions', label: '' }];
    const first = horarios[0];
    // exclude nested details like replacements/faltas so the horarios table stays clean
    const excludeKeys = ['replacements', 'faltas', 'reemplazos', 'replacements_list'];
    const keys = Object.keys(first).filter(k => !excludeKeys.includes(k));
    const cols = keys.map((k) => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
    return cols.concat([{ key: '__actions', label: '' }]);
  }, [horarios]);

  const handleEdit = (row: any) => setEditing(row);

  const renderCell = (row: any, key: string) => {
    if (key === '__actions') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => navigate(`/admin/horarios/${row.id}`)} title="Ver" style={{ padding: 8, background: 'transparent', color: '#555', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaEye />
          </button>
          <button onClick={() => handleEdit(row)} title="Editar" style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaPen />
          </button>
          <button onClick={() => setDeleting(row)} title="Borrar" style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
      );
    }

    // hide any nested arrays/objects so the table doesn't print long JSON
    const val = row?.[key];
    if (Array.isArray(val) || (val && typeof val === 'object')) {
      return <span style={{ color: '#666' }}>—</span>;
    }

    return undefined;
  };

  const performDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteHorario(deleting.id);
      setHorarios((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
      toast.success('Eliminado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) {
      console.error('delete failed', err);
      alert('No se pudo eliminar');
    } finally {
      setSaving(false);
    }
  };

  const [fieldName, setFieldName] = React.useState('');
  const [formErrors, setFormErrors] = React.useState<{ name?: string }>({});

  React.useEffect(() => {
    if (!editing) return;
    setFieldName(editing.name || editing.Name || '');
    setFormErrors({});
  }, [editing]);

  const handleModalCancel = () => setEditing(null);

  const handleModalSubmit = async () => {
    if (!editing) return;
    const newErrors: typeof formErrors = {};
    if (!fieldName.trim()) newErrors.name = 'El nombre es obligatorio';
    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const payload: any = { name: fieldName };
      const resp = await updateHorario(editing.id, payload);
      setHorarios((prev) => prev.map((r) => (r.id === editing.id ? (resp.data && resp.data.horario) || { ...r, ...payload } : r)));
      setEditing(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) {
      console.error('update failed', err);
      alert('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Horarios</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Buscar..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #333', background: '#2a2a2a', color: '#fff' }} />
          </div>
        </div>

        {loading && <p>Cargando horarios...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <>
            {/* if backend returned full list without pagination, slice client-side to avoid huge table */}
            {(() => {
              const useClientSlice = (totalCount === (horarios?.length || 0)) && (horarios.length > perPage);
              const displayed = useClientSlice ? horarios.slice((page - 1) * perPage, page * perPage) : horarios;
              return <DataTable columns={columns} data={displayed} renderCell={renderCell} minWidth={1400} />;
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ color: '#666' }}>Mostrando {((totalCount === (horarios?.length || 0)) && (horarios.length > perPage) ? Math.min(perPage, horarios.length - (page - 1) * perPage) : horarios.length)} de {totalCount}</div>
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

        <FormModal
          isOpen={!!editing}
          title="Editar Horario"
          fields={[
            { label: 'ID', value: editing?.id?.toString() || '', onChange: () => {}, readOnly: true },
            { label: 'Nombre', value: fieldName, onChange: setFieldName, error: formErrors.name },
          ]}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
          submitLabel={saving ? 'Guardando...' : 'Guardar'}
        />

        <ConfirmModal
          visible={!!deleting}
          title="Eliminar horario"
          message={deleting ? `¿Eliminar horario ${deleting.id} — ${deleting.name || ''}?` : '¿Eliminar?'}
          onCancel={() => setDeleting(null)}
          onConfirm={performDelete}
          loading={saving}
          cancelLabel="Cancelar"
          confirmLabel="Eliminar"
        />

        <ToastContainer position="top-right" autoClose={1000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </AdminLayout>
  );
}

// Small helper component for styled pagination buttons
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
