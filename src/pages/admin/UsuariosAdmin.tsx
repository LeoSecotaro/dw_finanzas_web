import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listUsers, createUser, updateUser, deleteUser } from '../../api/usersApi';
import { FaPen, FaTimes } from 'react-icons/fa';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UsuariosAdmin() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  // server-side list controls
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // create form state
  const [createName, setCreateName] = React.useState('');
  const [createEmail, setCreateEmail] = React.useState('');
  const [createApodo, setCreateApodo] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = { page, per_page: perPage };
        if (q) params.q = q;
        const r = await listUsers(params);
        if (cancelled) return;
        const data = r.data || {};
        const list = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
        setUsers(list);
        setTotalPages(data.total_pages || 1);
        setPage(data.current_page || page);
        setTotalCount(data.total_count || (list.length || 0));
      } catch (e) {
        console.error('failed to load users', e);
        if (cancelled) return;
        setError('No se pudieron cargar usuarios');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [q, page, perPage]);

  const columns = React.useMemo(() => {
    if (!users || users.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'email', label: 'Email' }, { key: '__actions', label: '' }];
    const first = users[0];
    const exclude = ['password', 'encrypted_password', 'roles', 'horarios', 'replacements', 'faltas'];
    const keys = Object.keys(first).filter(k => !exclude.includes(k));
    // if roles present, show a roles column explicitly
    if ('roles' in first) keys.push('roles');
    const cols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
    return cols.concat([{ key: '__actions', label: '' }]);
  }, [users]);

  const renderCell = (row: any, key: string) => {
    if (key === '__actions') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setEditing(row)} style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaPen /></button>
          <button onClick={() => setDeleting(row)} style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaTimes /></button>
        </div>
      );
    }

    // render roles array nicely
    if (key === 'roles' && Array.isArray(row.roles)) {
      return <span>{row.roles.map((r: any) => r.name).join(', ')}</span>;
    }

    const val = row?.[key];
    if (Array.isArray(val) || (val && typeof val === 'object')) return <span style={{ color: '#666' }}>—</span>;
    return undefined;
  };

  const handleEditSubmit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = { name: editing.name, email: editing.email };
      const resp = await updateUser(editing.id, payload);
      setUsers(prev => prev.map(u => u.id === editing.id ? (resp.data && resp.data.user) || { ...u, ...payload } : u));
      setEditing(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo editar'); } finally { setSaving(false); }
  };

  const handleCreateCancel = () => setCreating(false);

  const handleCreateSubmit = async () => {
    setSaving(true);
    try {
      const payload = { name: createName, email: createEmail, apodo: createApodo };
      const resp = await createUser(payload);
      let created = resp.data && (resp.data.user || resp.data);
      if (!created) created = { id: Math.max(0, ...users.map(u => u.id || 0)) + 1, ...payload };
      setUsers(prev => [created, ...prev]);
      setCreating(false);
      setCreateName(''); setCreateEmail(''); setCreateApodo('');
      toast.success('Creado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo crear usuario'); } finally { setSaving(false); }
  };

  const performDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try { await deleteUser(deleting.id); setUsers(prev => prev.filter(u => u.id !== deleting.id)); setDeleting(null); toast.success('Eliminado con éxito', { autoClose: 1000, position: 'top-right' }); } catch (err) { console.error(err); alert('No se pudo eliminar'); } finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Usuarios</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Buscar usuario..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #333', background: '#2a2a2a', color: '#fff' }} />
          </div>
        </div>

        {loading && <p>Cargando usuarios...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <>
            <DataTable columns={columns} data={users} renderCell={renderCell} minWidth={1100} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ color: '#666' }}>Mostrando {users.length} de {totalCount}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Pagination buttons styled blue with lift-on-hover */}
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

        <FormModal isOpen={!!editing} title="Editar Usuario" fields={[{ label: 'ID', value: editing?.id?.toString() || '', onChange: () => {}, readOnly: true }, { label: 'Nombre', value: editing?.name || '', onChange: (v) => setEditing((prev:any) => ({ ...prev, name: v })), error: undefined }, { label: 'Email', value: editing?.email || '', onChange: (v) => setEditing((prev:any) => ({ ...prev, email: v })), error: undefined }]} onCancel={() => setEditing(null)} onSubmit={handleEditSubmit} submitLabel={saving ? 'Guardando...' : 'Guardar'} />

        <FormModal isOpen={creating} title="Crear Usuario" fields={[{ label: 'Nombre', value: createName, onChange: setCreateName, error: undefined }, { label: 'Email', value: createEmail, onChange: setCreateEmail, error: undefined }, { label: 'Apodo', value: createApodo, onChange: setCreateApodo, error: undefined }]} onCancel={handleCreateCancel} onSubmit={handleCreateSubmit} submitLabel={saving ? 'Creando...' : 'Crear'} />

        <ConfirmModal visible={!!deleting} title="Eliminar usuario" message={deleting ? `¿Eliminar usuario ${deleting.id} — ${deleting.name || ''}?` : '¿Eliminar?'} onCancel={() => setDeleting(null)} onConfirm={performDelete} loading={saving} cancelLabel="Cancelar" confirmLabel="Eliminar" />

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
