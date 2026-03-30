import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listRoles, createRole, updateRole, deleteRole } from '../../api/rolesApi';
import { FaPen, FaTimes, FaPlus } from 'react-icons/fa';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RolesAdmin() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listRoles()
      .then((resp) => {
        if (cancelled) return;
        let data: any = resp.data;
        if (data && data.roles) data = data.roles;
        if (data && data.data) data = data.data;
        if (!Array.isArray(data)) {
          const arr = Object.values(data).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) data = arr;
        }
        setRoles(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('failed to load roles', err);
        if (cancelled) return;
        setError('No se pudieron cargar los roles');
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
    if (!roles || roles.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: '__actions', label: '' }];
    const first = roles[0];
    const keys = Object.keys(first);
    const cols = keys.map((k) => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
    return cols.concat([{ key: '__actions', label: '' }]);
  }, [roles]);

  const handleEdit = (row: any) => setEditing(row);

  const renderCell = (row: any, key: string) => {
    if (key === '__actions') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => handleEdit(row)} title="Editar" style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaPen />
          </button>
          <button onClick={() => setDeleting(row)} title="Borrar" style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
      );
    }
    return undefined;
  };

  const performDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteRole(deleting.id);
      setRoles((prev) => prev.filter((r) => r.id !== deleting.id));
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
      const resp = await updateRole(editing.id, payload);
      setRoles((prev) => prev.map((r) => (r.id === editing.id ? (resp.data && resp.data.role) || { ...r, ...payload } : r)));
      setEditing(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) {
      console.error('update failed', err);
      alert('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setCreating(true);
    setFieldName('');
    setFormErrors({});
  };

  const handleCreateCancel = () => setCreating(false);

  const handleCreateSubmit = async () => {
    const newErrors: typeof formErrors = {};
    if (!fieldName.trim()) newErrors.name = 'El nombre es obligatorio';
    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const payload: any = { name: fieldName };
      const resp = await createRole(payload);
      let created = resp.data && (resp.data.role || resp.data);
      if (!created) {
        const maybe = Object.values(resp.data || {}).find((v: any) => v && v.id);
        if (maybe) created = maybe;
      }
      if (!created) created = { id: Math.max(0, ...roles.map((c) => c.id || 0)) + 1, ...payload };
      setRoles((prev) => [created, ...prev]);
      setCreating(false);
      toast.success('Creado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) {
      console.error('create failed', err);
      alert('No se pudo crear rol');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Roles</h2>
          <div>
            <button
              onClick={openCreate}
              onMouseEnter={() => setHoverCreate(true)}
              onMouseLeave={() => setHoverCreate(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#2e7d32',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transform: hoverCreate ? 'translateY(-4px)' : 'none',
                boxShadow: hoverCreate ? '0px 6px 16px rgba(0, 0, 0, 0.22)' : 'none',
                transition: 'transform 260ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 260ms ease',
              }}
            >
              <FaPlus /> Crear rol
            </button>
          </div>
        </div>

        {loading && <p>Cargando roles...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <DataTable columns={columns} data={roles} renderCell={renderCell} minWidth={1400} />
        )}

        <FormModal
          isOpen={!!editing}
          title="Editar Rol"
          fields={[
            { label: 'ID', value: editing?.id?.toString() || '', onChange: () => {}, readOnly: true },
            { label: 'Nombre', value: fieldName, onChange: setFieldName, error: formErrors.name },
          ]}
          onCancel={handleModalCancel}
          onSubmit={handleModalSubmit}
          submitLabel={saving ? 'Guardando...' : 'Guardar'}
        />

        <FormModal
          isOpen={creating}
          title="Crear Rol"
          fields={[{ label: 'Nombre', value: fieldName, onChange: setFieldName, error: formErrors.name }]}
          onCancel={handleCreateCancel}
          onSubmit={handleCreateSubmit}
          submitLabel={saving ? 'Creando...' : 'Crear'}
        />

        <ConfirmModal
          visible={!!deleting}
          title="Eliminar rol"
          message={deleting ? `¿Eliminar rol ${deleting.id} — ${deleting.name || ''}?` : '¿Eliminar?'}
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
