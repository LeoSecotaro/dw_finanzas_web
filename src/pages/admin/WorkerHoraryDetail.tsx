import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { useParams } from 'react-router-dom';
import * as workerApi from '../../api/workerHorariesApi';
import { FaPlus, FaPen, FaTimes } from 'react-icons/fa';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function WorkerHoraryDetail() {
  const { id } = useParams();
  const horarioId = Number(id);

  const [horario, setHorario] = React.useState<any | null>(null);
  const [replacements, setReplacements] = React.useState<any[]>([]);
  const [faltas, setFaltas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editingReplacement, setEditingReplacement] = React.useState<any | null>(null);
  const [creatingReplacement, setCreatingReplacement] = React.useState(false);
  const [deletingReplacement, setDeletingReplacement] = React.useState<any | null>(null);

  const [editingFalta, setEditingFalta] = React.useState<any | null>(null);
  const [creatingFalta, setCreatingFalta] = React.useState(false);
  const [deletingFalta, setDeletingFalta] = React.useState<any | null>(null);

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([workerApi.getWorkerHorary(horarioId), workerApi.listReplacements(horarioId), workerApi.listFaltas(horarioId)])
      .then(([h, reps, falt]) => {
        if (cancelled) return;
        setHorario(h.data || null);
        setReplacements((reps.data && (reps.data.replacements || reps.data)) || []);
        setFaltas((falt.data && (falt.data.faltas || falt.data)) || []);
      })
      .catch((err) => {
        console.error('failed to load worker horary detail', err);
        if (cancelled) return;
        setError('No se pudo cargar el detalle');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [horarioId]);

  // replacements handlers
  const [repName, setRepName] = React.useState('');
  const [repLastName, setRepLastName] = React.useState('');
  const [repErrors, setRepErrors] = React.useState<{ name?: string; last_name?: string }>({});

  React.useEffect(() => {
    if (!editingReplacement) return;
    setRepName(editingReplacement.name || '');
    setRepLastName(editingReplacement.last_name || editingReplacement.lastName || '');
    setRepErrors({});
  }, [editingReplacement]);

  const handleCreateRep = () => { setCreatingReplacement(true); setRepName(''); setRepLastName(''); setRepErrors({}); };
  const handleCreateRepCancel = () => setCreatingReplacement(false);
  const handleCreateRepSubmit = async () => {
    const errs: typeof repErrors = {};
    if (!repName.trim()) errs.name = 'El nombre es obligatorio';
    if (!repLastName.trim()) errs.last_name = 'El apellido es obligatorio';
    setRepErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { name: repName, last_name: repLastName };
      const resp = await workerApi.createReplacement(horarioId, payload);
      let created = resp.data && (resp.data.replacement || resp.data);
      if (!created) created = { id: Math.max(0, ...replacements.map((r) => r.id || 0)) + 1, ...payload };
      setReplacements((prev) => [created, ...prev]);
      setCreatingReplacement(false);
      toast.success('Creado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) {
      console.error('create replacement failed', err);
      alert('No se pudo crear reemplazo');
    } finally { setSaving(false); }
  };

  const handleEditRep = (r: any) => setEditingReplacement(r);
  const handleEditRepCancel = () => setEditingReplacement(null);
  const handleEditRepSubmit = async () => {
    if (!editingReplacement) return;
    const errs: typeof repErrors = {};
    if (!repName.trim()) errs.name = 'El nombre es obligatorio';
    if (!repLastName.trim()) errs.last_name = 'El apellido es obligatorio';
    setRepErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { name: repName, last_name: repLastName };
      const resp = await workerApi.updateReplacement(horarioId, editingReplacement.id, payload);
      setReplacements((prev) => prev.map((r) => (r.id === editingReplacement.id ? (resp.data && resp.data.replacement) || { ...r, ...payload } : r)));
      setEditingReplacement(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo editar'); } finally { setSaving(false); }
  };

  const handleDeleteRep = (r: any) => setDeletingReplacement(r);
  const performDeleteRep = async () => { if (!deletingReplacement) return; setSaving(true); try { await workerApi.deleteReplacement(horarioId, deletingReplacement.id); setReplacements((prev) => prev.filter((p) => p.id !== deletingReplacement.id)); setDeletingReplacement(null); toast.success('Eliminado con éxito', { autoClose: 1000, position: 'top-right' }); } catch (err) { console.error(err); alert('No se pudo eliminar'); } finally { setSaving(false); } };

  // faltas handlers (use reason instead of name)
  const [fReason, setFReason] = React.useState('');
  const [fErrors, setFErrors] = React.useState<{ reason?: string }>({});

  React.useEffect(() => {
    if (!editingFalta) return;
    setFReason(editingFalta.reason || editingFalta.razon || '');
    setFErrors({});
  }, [editingFalta]);

  const handleCreateFalta = () => { setCreatingFalta(true); setFReason(''); setFErrors({}); };
  const handleCreateFaltaCancel = () => setCreatingFalta(false);
  const handleCreateFaltaSubmit = async () => {
    const errs: typeof fErrors = {};
    if (!fReason.trim()) errs.reason = 'La razón es obligatoria';
    setFErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { reason: fReason };
      const resp = await workerApi.createFalta(horarioId, payload);
      let created = resp.data && (resp.data.falta || resp.data);
      if (!created) created = { id: Math.max(0, ...faltas.map((r) => r.id || 0)) + 1, ...payload };
      setFaltas((prev) => [created, ...prev]);
      setCreatingFalta(false);
      toast.success('Creado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo crear falta'); } finally { setSaving(false); }
  };

  const handleEditFalta = (f: any) => setEditingFalta(f);
  const handleEditFaltaCancel = () => setEditingFalta(null);
  const handleEditFaltaSubmit = async () => {
    if (!editingFalta) return;
    const errs: typeof fErrors = {};
    if (!fReason.trim()) errs.reason = 'La razón es obligatoria';
    setFErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { reason: fReason };
      const resp = await workerApi.updateFalta(horarioId, editingFalta.id, payload);
      setFaltas((prev) => prev.map((r) => (r.id === editingFalta.id ? (resp.data && resp.data.falta) || { ...r, ...payload } : r)));
      setEditingFalta(null);
      toast.success('Editado con éxito', { autoClose: 1000, position: 'top-right' });
    } catch (err) { console.error(err); alert('No se pudo editar'); } finally { setSaving(false); }
  };

  const handleDeleteFalta = (f: any) => setDeletingFalta(f);
  const performDeleteFalta = async () => { if (!deletingFalta) return; setSaving(true); try { await workerApi.deleteFalta(horarioId, deletingFalta.id); setFaltas((prev) => prev.filter((p) => p.id !== deletingFalta.id)); setDeletingFalta(null); toast.success('Eliminado con éxito', { autoClose: 1000, position: 'top-right' }); } catch (err) { console.error(err); alert('No se pudo eliminar'); } finally { setSaving(false); } };

  return (
    <AdminLayout>
      <div style={{ padding: 18 }}>
        <h2>Horario #{horarioId}</h2>
        {horario && <p style={{ color: '#888' }}>{horario.name || horario.title || ''}</p>}
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 18 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Replacements</h3>
              <button onClick={handleCreateRep} style={{ background: '#2e7d32', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                <FaPlus />
              </button>
            </div>

            <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'last_name', label: 'Apellido' }, { key: '__actions', label: '' }]} data={replacements} renderCell={(r, k) => {
              if (k === '__actions') return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => handleEditRep(r)} style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaPen /></button>
                  <button onClick={() => handleDeleteRep(r)} style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaTimes /></button>
                </div>
              );
              return undefined;
            }} minWidth={360} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Faltas</h3>
              <button onClick={handleCreateFalta} style={{ background: '#2e7d32', color: '#fff', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
                <FaPlus />
              </button>
            </div>

            <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'reason', label: 'Razón' }, { key: '__actions', label: '' }]} data={faltas} renderCell={(r, k) => {
              if (k === '__actions') return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => handleEditFalta(r)} style={{ padding: 8, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaPen /></button>
                  <button onClick={() => handleDeleteFalta(r)} style={{ padding: 8, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaTimes /></button>
                </div>
              );
              return undefined;
            }} minWidth={360} />
          </div>
        </div>

        <FormModal isOpen={creatingReplacement} title="Crear Replacement" fields={[{ label: 'Nombre', value: repName, onChange: setRepName, error: repErrors.name }, { label: 'Apellido', value: repLastName, onChange: setRepLastName, error: repErrors.last_name }]} onCancel={handleCreateRepCancel} onSubmit={handleCreateRepSubmit} submitLabel={saving ? 'Creando...' : 'Crear'} />
        <FormModal isOpen={!!editingReplacement} title="Editar Replacement" fields={[{ label: 'ID', value: editingReplacement?.id?.toString() || '', onChange: () => {}, readOnly: true }, { label: 'Nombre', value: repName, onChange: setRepName, error: repErrors.name }, { label: 'Apellido', value: repLastName, onChange: setRepLastName, error: repErrors.last_name }]} onCancel={handleEditRepCancel} onSubmit={handleEditRepSubmit} submitLabel={saving ? 'Guardando...' : 'Guardar'} />
        <ConfirmModal visible={!!deletingReplacement} title="Eliminar replacement" message={deletingReplacement ? `¿Eliminar replacement ${deletingReplacement.id} — ${deletingReplacement.name || ''}?` : '¿Eliminar?'} onCancel={() => setDeletingReplacement(null)} onConfirm={performDeleteRep} loading={saving} cancelLabel="Cancelar" confirmLabel="Eliminar" />

        <FormModal isOpen={creatingFalta} title="Crear Falta" fields={[{ label: 'Razón', value: fReason, onChange: setFReason, error: fErrors.reason }]} onCancel={handleCreateFaltaCancel} onSubmit={handleCreateFaltaSubmit} submitLabel={saving ? 'Creando...' : 'Crear'} />
        <FormModal isOpen={!!editingFalta} title="Editar Falta" fields={[{ label: 'ID', value: editingFalta?.id?.toString() || '', onChange: () => {}, readOnly: true }, { label: 'Razón', value: fReason, onChange: setFReason, error: fErrors.reason }]} onCancel={handleEditFaltaCancel} onSubmit={handleEditFaltaSubmit} submitLabel={saving ? 'Guardando...' : 'Guardar'} />
        <ConfirmModal visible={!!deletingFalta} title="Eliminar falta" message={deletingFalta ? `¿Eliminar falta ${deletingFalta.id} — ${deletingFalta.name || ''}?` : '¿Eliminar?'} onCancel={() => setDeletingFalta(null)} onConfirm={performDeleteFalta} loading={saving} cancelLabel="Cancelar" confirmLabel="Eliminar" />

        <ToastContainer position="top-right" autoClose={1000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </AdminLayout>
  );
}
