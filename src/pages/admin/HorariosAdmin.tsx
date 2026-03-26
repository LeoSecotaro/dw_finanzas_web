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

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listHorarios()
      .then((resp) => {
        if (cancelled) return;
        let data: any = resp.data;
        if (data && data.horarios) data = data.horarios;
        if (data && data.data) data = data.data;
        if (!Array.isArray(data)) {
          const arr = Object.values(data).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) data = arr;
        }
        setHorarios(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('failed to load horarios', err);
        if (cancelled) return;
        setError('No se pudieron cargar los horarios');
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
        </div>

        {loading && <p>Cargando horarios...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && (
          <DataTable columns={columns} data={horarios} renderCell={renderCell} minWidth={800} />
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
