import React from 'react';
import { listWorkerHoraries, createWorkerHorary, deleteWorkerHorary, createReplacement, deleteReplacement } from '../../api/workerHorariesApi';
import { toast } from 'react-toastify';
import type { HoraryParams } from '../../api/workerHorariesApi';
import CalendarGrid from '../../components/schedules/CalendarGrid';
import Navbar from '../../components/navbar/Navbar';
import CreateScheduleModal from '../../components/schedules/CreateScheduleModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import CreateReplacementModal from '../../components/schedules/CreateReplacementModal';

export default function Schedules() {
  const [horaries, setHoraries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [showReplacement, setShowReplacement] = React.useState(false);
  const [creatingReplacement, setCreatingReplacement] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [selectedToDelete, setSelectedToDelete] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);
  const [hoverReplacement, setHoverReplacement] = React.useState(false);
  const [initialReplacementHoraryId, setInitialReplacementHoraryId] = React.useState<number | undefined>(undefined);

  // modal initial values when opened from calendar click
  const [modalInitialDayId, setModalInitialDayId] = React.useState<number | undefined>(undefined);
  const [modalInitialStart, setModalInitialStart] = React.useState<string | undefined>(undefined);
  const [modalInitialEnd, setModalInitialEnd] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setLoading(true);
    listWorkerHoraries().then((r) => {
      setHoraries(r.data || []);
    }).catch((e) => {
      console.error('failed to load horaries', e);
      setHoraries([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = (p: { day: string; day_id?: number; start: string; end: string; title?: string }) => {
    setCreating(true);
    // prepare payload expected by backend (only permitted fields)
    const payload: HoraryParams = {
      start_time: p.start,
      end_time: p.end,
    };

    if (p.day_id) payload.day_id = p.day_id;
    if (p.title) payload.title = p.title;

    createWorkerHorary(payload).then((res) => {
      // assume API returns created object in res.data
      const created = res.data;
      setHoraries((s) => [...s, created]);
      setShowCreate(false);
      toast.success('Horario creado con éxito', { autoClose: 1000 });
    }).catch((e: any) => {
      console.error('failed to create horary', e);
      // show server validation message if available
      const serverMessage = e?.response?.data || e?.response?.statusText;
      if (serverMessage) {
        alert('Error al crear horario: ' + JSON.stringify(serverMessage));
      } else {
        // fallback: add local item so user sees it; mark with temp id
        const newItem = { id: Date.now(), day: p.day, day_id: p.day_id, start: p.start, end: p.end, title: p.title, _pending: true };
        setHoraries((s) => [...s, newItem]);
      }
      setShowCreate(false);
    }).finally(() => setCreating(false));
  };

  // handler for clicks coming from CalendarGrid slots
  const handleGridCreate = (data: { day_id: number; start_time: string; end_time?: string }) => {
    setModalInitialDayId(data.day_id);
    setModalInitialStart(data.start_time);
    setModalInitialEnd(data.end_time);
    setShowCreate(true);
  };

  // handler when user clicks a block in the grid
  const handleGridDeleteRequest = (hr: any) => {
    setSelectedToDelete(hr);
    setShowDeleteConfirm(true);
  };

  // handler when user clicks a block to create a replacement for that horary
  const handleGridReplaceRequest = (hr: any) => {
    setInitialReplacementHoraryId(hr?.id);
    setShowReplacement(true);
  };

  // handler when user requests deletion of a replacement
  const handleDeleteReplacementRequest = (replacement: any, horaryId: number) => {
    // store as selectedToDelete but mark it as replacement to show different message
    setSelectedToDelete({ ...replacement, _isReplacement: true, horary_id: horaryId });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedToDelete) {
      setShowDeleteConfirm(false);
      return;
    }
    setDeleting(true);
    const id = selectedToDelete.id;
    if (id) {
      deleteWorkerHorary(id).then(() => {
        setHoraries((s) => s.filter((x) => x.id !== id));
        setShowDeleteConfirm(false);
        toast.success('Horario eliminado con éxito', { autoClose: 1000 });
      }).catch((e) => {
        console.error('failed to delete horary', e);
        alert('No se pudo eliminar el horario.');
        setShowDeleteConfirm(false);
      }).finally(() => setDeleting(false));
    } else {
      // no id (pending local item) -> just remove locally
      setHoraries((s) => s.filter((x) => x !== selectedToDelete));
      setShowDeleteConfirm(false);
      setDeleting(false);
      toast.success('Horario eliminado', { autoClose: 1000 });
    }
    setSelectedToDelete(null);
  };
  
  const handleConfirm = () => {
    if (selectedToDelete?._isReplacement) {
      // delete replacement
      const replacementId = selectedToDelete.id;
      const horaryId = selectedToDelete.horary_id;
      if (replacementId && horaryId) {
        setDeleting(true);
        deleteReplacement(horaryId, replacementId).then(() => {
           // remove replacement from local state
           setHoraries((s) => s.map((h) => {
             if (h.id === horaryId) {
               const remaining = (Array.isArray(h.replacements) ? h.replacements : (h.replacements ? [h.replacements] : [])).filter((r: any) => r.id !== replacementId);
               return { ...h, replacements: remaining, replacement: remaining[remaining.length - 1] || null };
             }
             return h;
           }));
          toast.success('Reemplazo eliminado con éxito', { autoClose: 1000 });
           setShowDeleteConfirm(false);
           setSelectedToDelete(null);
         }).catch((e) => {
           console.error('failed to delete replacement', e);
           alert('No se pudo eliminar el reemplazo.');
           setShowDeleteConfirm(false);
         }).finally(() => setDeleting(false));
       } else {
         setShowDeleteConfirm(false);
         setSelectedToDelete(null);
       }
     } else {
       // fallback to delete horary flow
       handleConfirmDelete();
     }
   };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Horarios" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1600, width: '100%', padding: 24 }}>
          {loading ? <div>Cargando...</div> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Calendario</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowReplacement(true)}
                    onMouseEnter={() => setHoverReplacement(true)}
                    onMouseLeave={() => setHoverReplacement(false)}
                    style={{
                      background: hoverReplacement ? '#2b8a3e' : '#32a84b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      transform: hoverReplacement ? 'translateY(-3px)' : 'none',
                      boxShadow: hoverReplacement ? '0 8px 20px rgba(50,168,75,0.24)' : 'none',
                    }}
                  >
                    Crear reemplazo
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    onMouseEnter={() => setHoverCreate(true)}
                    onMouseLeave={() => setHoverCreate(false)}
                    style={{
                      background: hoverCreate ? '#105bd6' : '#1677ff',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      transform: hoverCreate ? 'translateY(-3px)' : 'none',
                      boxShadow: hoverCreate ? '0 8px 20px rgba(16,91,214,0.24)' : 'none',
                    }}
                  >
                    Crear horario
                  </button>
                </div>
              </div>
              <CalendarGrid horaries={horaries} onCreate={handleGridCreate} onDelete={handleGridDeleteRequest} onReplace={handleGridReplaceRequest} onDeleteReplacement={handleDeleteReplacementRequest} />
            </>
          )}
        </div>
      </main>
      <CreateScheduleModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        loading={creating}
        initialDayId={modalInitialDayId}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
      />

      <CreateReplacementModal
        visible={showReplacement}
        onClose={() => { setShowReplacement(false); setInitialReplacementHoraryId(undefined); }}
        onCreate={(p) => {
          setCreatingReplacement(true);
          // call nested create replacement: POST /worker_horaries/:horary_id/replacements
          const parent = horaries.find(h => h.id === p.horaryId);
          if (!parent) {
            alert('No se encontró el horario padre.');
            setCreatingReplacement(false);
            return;
          }
          const start_time = parent.start_time || parent.start || undefined;
          const end_time = parent.end_time || parent.end || undefined;
          if (!start_time || !end_time) {
            alert('El horario padre no tiene horas válidas (start/end).');
            setCreatingReplacement(false);
            return;
          }

          createReplacement(p.horaryId, { name: p.name, last_name: p.last_name, start_time, end_time }).then((res) => {
            // on success close modal and update local state so CalendarGrid shows replacement immediately
            setShowReplacement(false);
            setInitialReplacementHoraryId(undefined);
            const created = res?.data;
            if (created) {
              setHoraries((s) => s.map((h) => {
                if (h.id === p.horaryId) {
                  const existing = Array.isArray(h.replacements) ? h.replacements : (h.replacements ? [h.replacements] : []);
                  return { ...h, replacements: [...existing, created], replacement: created };
                }
                return h;
              }));
            }
            // show success toast even if API didn't return full object
            toast.success('Reemplazo creado con éxito', { autoClose: 2000 });
          }).catch((e) => {
            console.error('failed to create replacement', e);
            alert('No se pudo crear el reemplazo.');
          }).finally(() => setCreatingReplacement(false));
        }}
        loading={creatingReplacement}
        horaries={horaries}
        initialHoraryId={initialReplacementHoraryId}
      />

      {/* Delete confirmation modal (reusable) */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title={selectedToDelete?._isReplacement ? 'Confirmar eliminación de reemplazo' : 'Confirmar eliminación'}
        message={selectedToDelete?._isReplacement ? (
          <div>¿Eliminar el reemplazo "{selectedToDelete?.name} {selectedToDelete?.last_name}" del horario seleccionado?</div>
        ) : (
          <div>¿Eliminar el horario "{selectedToDelete?.title || selectedToDelete?.name || 'Horario'}" ({selectedToDelete?.start_time || selectedToDelete?.start} - {selectedToDelete?.end_time || selectedToDelete?.end})?</div>
        )}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedToDelete(null); }}
        onConfirm={handleConfirm}
        loading={deleting}
        cancelLabel="Cancelar"
        confirmLabel={selectedToDelete?._isReplacement ? 'Eliminar reemplazo' : 'Eliminar'}
      />

      {/* react-toastify handles toasts globally (ToastContainer in main.tsx) */}
    </div>
  );
}
