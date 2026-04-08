import React from 'react';
import { listWorkerHoraries, getWorkerHorary, createWorkerHorary, deleteWorkerHorary, createReplacement, deleteReplacement, createFalta, deleteFalta } from '../../api/workerHorariesApi';
import { toast } from 'react-toastify';
import type { HoraryParams } from '../../api/workerHorariesApi';
import CalendarGrid from '../../components/schedules/CalendarGrid';
import Navbar from '../../components/navbar/Navbar';
import CreateScheduleModal from '../../components/schedules/CreateScheduleModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import CreateReplacementModal from '../../components/schedules/CreateReplacementModal';
import UploadModal from '../../components/modals/UploadModal';
import { listConsultorios } from '../../api/consultoriosApi';
import CreateFaltaModal from '../../components/schedules/CreateFaltaModal';
import { getCurrentUser } from '../../api/usersApi';

export default function Schedules() {
  const [horaries, setHoraries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [showReplacement, setShowReplacement] = React.useState(false);
  const [creatingReplacement, setCreatingReplacement] = React.useState(false);
  const [showUpload, setShowUpload] = React.useState(false);
  const [hoverUpload, setHoverUpload] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [selectedToDelete, setSelectedToDelete] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [hoverCreate, setHoverCreate] = React.useState(false);
  const [hoverReplacement, setHoverReplacement] = React.useState(false);
  const [initialReplacementHoraryId, setInitialReplacementHoraryId] = React.useState<number | undefined>(undefined);
  const [showActionChoice, setShowActionChoice] = React.useState(false);
  const [actionHorary, setActionHorary] = React.useState<any | null>(null);
  const [showFaltaModal, setShowFaltaModal] = React.useState(false);
  const [creatingFalta, setCreatingFalta] = React.useState(false);
  const [hoverActionCancel, setHoverActionCancel] = React.useState(false);
  const [hoverActionReplace, setHoverActionReplace] = React.useState(false);
  const [hoverActionFalta, setHoverActionFalta] = React.useState(false);

  // modal initial values when opened from calendar click
  const [modalInitialDayId, setModalInitialDayId] = React.useState<number | undefined>(undefined);
  const [modalInitialStart, setModalInitialStart] = React.useState<string | undefined>(undefined);
  const [modalInitialEnd, setModalInitialEnd] = React.useState<string | undefined>(undefined);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [weekDirection, setWeekDirection] = React.useState<'next'|'prev'|'none'>('none');
  const [consultorios, setConsultorios] = React.useState<any[]>([]);
  const [selectedConsultorioId, setSelectedConsultorioId] = React.useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);
  const [currentUserRoles, setCurrentUserRoles] = React.useState<string[]>([]);

  const getStartOfWeek = (date: Date, offset = 0) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) .. 6 (Sat)
    // compute Monday as start of week
    const diffToMon = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diffToMon + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = React.useMemo(() => getStartOfWeek(new Date(), weekOffset), [weekOffset]);

  // load horaries (extracted so we can refresh after uploads)
  const loadHoraries = React.useCallback(async () => {
    setLoading(true);
    const usedConsultorio = selectedConsultorioId;
    try {
      const params: Record<string, any> = {};
      if (selectedConsultorioId) params.consultorio_id = selectedConsultorioId;
      let r = await listWorkerHoraries(params);
      // If the endpoint returns nothing for non-admins, try a few common fallback query params
      // so the frontend can request the unrestricted list while backend still supports role-based filtering.
      const tryFallbacks = async (): Promise<void> => {
        try {
          // basic parsed list from response
          const extractLength = (resp: any) => {
            if (!resp) return 0;
            if (Array.isArray(resp.data)) return resp.data.length;
            if (resp.data && Array.isArray(resp.data.months)) {
              return resp.data.months.reduce((acc: number, m: any) => acc + (Array.isArray(m.horarios) ? m.horarios.length : 0), 0);
            }
            if (resp.data && Array.isArray(resp.data.horarios)) return resp.data.horarios.length;
            return 0;
          };

          const initialCount = extractLength(r);
          if (initialCount === 0) {
            const fallbacks = [ { include_all: true }, { scope: 'all' }, { unscoped: true }, { all: true } ];
            for (const fb of fallbacks) {
              if (usedConsultorio !== selectedConsultorioId) return;
              try {
                const attempt = await listWorkerHoraries({ ...params, ...fb });
                const len = extractLength(attempt);
                console.debug('worker_horaries fallback attempt', fb, 'length', len, attempt && attempt.status);
                if (len > 0) {
                  r = attempt;
                  return;
                }
              } catch (e) {
                // ignore and continue trying other fallbacks
                console.warn('fallback worker_horaries attempt failed', fb, e);
              }
            }
          }
        } catch (err) {
          console.warn('error while attempting worker_horaries fallbacks', err);
        }
      };

      await tryFallbacks();

      // normalize response: backend may return either an array of horaries or a months grouping { months: [{ month, current, start_date, end_date, count, horarios: [...] }, ...] }
      let list = r.data || [];
      // if backend returns months grouping, flatten to a single list of horarios (preserve month info on each item if available)
      if (r.data && Array.isArray(r.data.months)) {
        const months = r.data.months as any[];
        const flattened: any[] = [];
        months.forEach((m) => {
          const hs = Array.isArray(m.horarios) ? m.horarios : [];
          // attach month metadata to each horary for debug/UI if needed
          hs.forEach((h: any) => { if (m.month) h._month = m.month; if (typeof m.current !== 'undefined') h._month_current = m.current; flattened.push(h); });
        });
        list = flattened;
        // also attach simple totals to the response object so downstream logic can read totals
        // prefer explicit counts from months if provided
        try {
          const totalFromMonths = months.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
          // override r.data for downstream meta logic
          (r as any).__flattened_total = totalFromMonths || flattened.length;
        } catch (e) { /* ignore */ }
      }
      // ignore this response if selected consultorio changed while fetching
      if (usedConsultorio !== selectedConsultorioId) {
        return;
      }
      // keep existing logic but use 'list' variable
      const needsDetails = list.some((h: any) => typeof h.replacements === 'undefined');
      if (needsDetails && list.length) {
        try {
          const details = await Promise.allSettled(list.map((h: any) => getWorkerHorary(h.id)));
          // if selection changed during nested detail requests, abort applying results
          if (usedConsultorio !== selectedConsultorioId) {
            return;
          }
          const merged = list.map((h: any, i: number) => {
            const det = details[i];
            if (det && det.status === 'fulfilled') {
              return det.value.data || h;
            }
            return h;
          });
          try { console.log('loaded horaries (merged)', merged.slice(0,5)); } catch (e) { /* ignore */ }
          try { (window as any).__horaries = merged; } catch (e) { /* ignore */ }
          setHoraries(merged);
        } catch (err) {
          console.warn('failed to fetch horary details, using list response', err);
          try { console.log('loaded horaries (list)', (list || []).slice(0,5)); } catch (e) { /* ignore */ }
          try { (window as any).__horaries = list; } catch (e) { /* ignore */ }
          setHoraries(list);
        }
      } else {
        try { console.log('loaded horaries (list)', (list || []).slice(0,5)); } catch (e) { /* ignore */ }
        try { (window as any).__horaries = list; } catch (e) { /* ignore */ }
        setHoraries(list);
      }
    } catch (e) {
      console.error('failed to load horaries', e);
      setHoraries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConsultorioId]);

  // load consultorios for dropdown
  React.useEffect(() => {
    listConsultorios().then((r) => {
      const data = r.data || [];
      setConsultorios(data);
      // auto-select the first consultorio so we don't show a "Todos" option
      if (data && data.length > 0) {
        setSelectedConsultorioId(data[0].id);
      }
    }).catch((e) => console.error('failed to load consultorios', e));
  }, []);

  // reload horaries when selected consultorio changes
  React.useEffect(() => {
    if (selectedConsultorioId === null) return; // avoid unfiltered requests
    loadHoraries();
  }, [selectedConsultorioId]);

  // load current user for permission checks
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await getCurrentUser();
        if (!mounted) return;
        const u = resp && resp.data ? resp.data : resp;
        const id = u?.id ?? null;
        const roles: string[] = [];
        if (u) {
          if (Array.isArray(u.roles)) roles.push(...u.roles.map((r: any) => (typeof r === 'string' ? r : r.name || String(r))));
          else if (u.role) roles.push(String(u.role));
          else if (u.current_role) roles.push(String(u.current_role));
        }
        setCurrentUserId(id ? Number(id) : null);
        setCurrentUserRoles(roles.map(r => String(r).toLowerCase()));
      } catch (e) {
        // ignore - permissions will be enforced server-side; client only improves UX
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isAdmin = React.useMemo(() => currentUserRoles.includes('admin'), [currentUserRoles]);
  // permissions for global actions: admins and 'doc' users
  const canUpload = React.useMemo(() => isAdmin || currentUserRoles.includes('doc'), [isAdmin, currentUserRoles]);
  const canCreateReplacementGlobal = React.useMemo(() => isAdmin || currentUserRoles.includes('doc'), [isAdmin, currentUserRoles]);
  const canCreateHoraryGlobal = React.useMemo(() => isAdmin || currentUserRoles.includes('doc'), [isAdmin, currentUserRoles]);

  const handleCreate = (p: { day: string; day_id?: number; start: string; end: string; title?: string }) => {
    setCreating(true);
    // prepare payload expected by backend (only permitted fields)
    const payload: HoraryParams = {
      start_time: p.start,
      end_time: p.end,
    };

    if (p.day_id) payload.day_id = p.day_id;
    if (p.title) payload.title = p.title;
    // include consultorio if modal provided it (ensures list endpoint will return the created item when filtered)
    if ((p as any).consultorio_id) {
      payload.consultorio_id = (p as any).consultorio_id;
    } else if (selectedConsultorioId) {
      // fallback: if modal didn't provide consultorio, use the currently selected consultorio
      payload.consultorio_id = selectedConsultorioId;
    }

    createWorkerHorary(payload).then((res) => {
      // assume API returns created object in res.data
      const created = res.data;
      // optimistically add created item to local state so user sees it immediately
      setHoraries((s) => [...s, created]);
      // re-sync authoritative list from server to avoid shape/visibility mismatches
      // (e.g. server-side consultorio filtering or normalized fields)
      try { loadHoraries(); } catch (e) { /* best-effort refresh */ }
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
    // only allow if admin or owner
    const ownerId = hr?.user_id ?? hr?.userId ?? hr?.userId;
    if (!isAdmin && currentUserId != null && Number(ownerId) !== Number(currentUserId)) {
      toast.error('No estás autorizado para eliminar este horario', { autoClose: 1500 });
      return;
    }
    setSelectedToDelete(hr);
    setShowDeleteConfirm(true);
  };

  // handler when user clicks a block to create a replacement for that horary
  const handleGridReplaceRequest = (hr: any) => {
    setInitialReplacementHoraryId(hr?.id);
    setShowReplacement(true);
  };

  // new handler when user clicks a block: open action choice modal
  const handleGridActionRequest = (hr: any) => {
    const ownerId = hr?.user_id ?? hr?.userId;
    if (!isAdmin && currentUserId != null && Number(ownerId) !== Number(currentUserId)) {
      toast.error('No estás autorizado para ver acciones de este horario', { autoClose: 1500 });
      return;
    }
    setActionHorary(hr);
    setShowActionChoice(true);
  };

  const handleOpenReplacementFromChoice = () => {
    setInitialReplacementHoraryId(actionHorary?.id);
    setShowReplacement(true);
    setShowActionChoice(false);
  };

  const handleOpenFaltaFromChoice = () => {
    setShowFaltaModal(true);
    setShowActionChoice(false);
  };

  // handler when user requests deletion of a replacement
  const handleDeleteReplacementRequest = (replacement: any, horaryId: number) => {
    // check ownership of parent horary
    const parent = horaries.find(h => h.id === horaryId);
    const ownerId = parent?.user_id ?? parent?.userId;
    if (!isAdmin && currentUserId != null && Number(ownerId) !== Number(currentUserId)) {
      toast.error('No estás autorizado para eliminar este reemplazo', { autoClose: 1500 });
      return;
    }
    setSelectedToDelete({ ...replacement, _isReplacement: true, horary_id: horaryId });
    setShowDeleteConfirm(true);
  };

  // handler when user requests deletion of a falta (absence)
  const handleDeleteFaltaRequest = (falta: any, horaryId: number) => {
    const parent = horaries.find(h => h.id === horaryId);
    const ownerId = parent?.user_id ?? parent?.userId;
    if (!isAdmin && currentUserId != null && Number(ownerId) !== Number(currentUserId)) {
      toast.error('No estás autorizado para eliminar esta falta', { autoClose: 1500 });
      return;
    }
    setSelectedToDelete({ ...falta, _isFalta: true, horary_id: horaryId });
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
        const status = e?.response?.status;
        if (status === 403 || status === 401) {
          toast.error('No estás autorizado para eliminar este horario', { autoClose: 1500 });
        } else {
          toast.error('No se pudo eliminar el horario', { autoClose: 1500 });
        }
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
           const status = e?.response?.status;
           if (status === 403 || status === 401) {
             toast.error('No estás autorizado para eliminar este reemplazo', { autoClose: 1500 });
           } else {
             toast.error('No se pudo eliminar el reemplazo', { autoClose: 1500 });
           }
           setShowDeleteConfirm(false);
         }).finally(() => setDeleting(false));
       } else {
         setShowDeleteConfirm(false);
         setSelectedToDelete(null);
       }
     } else if (selectedToDelete?._isFalta) {
       // delete falta
       const faltaId = selectedToDelete.id;
       const horaryId = selectedToDelete.horary_id;
       if (faltaId && horaryId) {
         setDeleting(true);
         deleteFalta(horaryId, faltaId).then(() => {
           setHoraries((s) => s.map((h) => {
             if (h.id === horaryId) {
               const remaining = (Array.isArray(h.faltas) ? h.faltas : (h.faltas ? [h.faltas] : [])).filter((r: any) => r.id !== faltaId);
               return { ...h, faltas: remaining, falta: remaining[remaining.length - 1] || null };
             }
             return h;
           }));
           toast.success('Falta eliminada con éxito', { autoClose: 1000 });
           setShowDeleteConfirm(false);
           setSelectedToDelete(null);
         }).catch((e) => {
           console.error('failed to delete falta', e);
           const status = e?.response?.status;
           if (status === 403 || status === 401) {
             toast.error('No estás autorizado para eliminar esta falta', { autoClose: 1500 });
           } else {
             toast.error('No se pudo eliminar la falta', { autoClose: 1500 });
           }
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

  // compute context for delete modal so we can show proper message for faltas and replacements
  const targetHorary = React.useMemo(() => {
    if (!selectedToDelete) return null;
    return horaries.find((h) => h.id === selectedToDelete.horary_id) || null;
  }, [selectedToDelete, horaries]);

  // render
  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
      <Navbar title="Horarios" />
      <main style={{ paddingTop: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1600, width: '100%', padding: 24 }}>
          {loading ? <div>Cargando...</div> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => { setWeekDirection('prev'); setWeekOffset((s) => s - 1); setTimeout(() => setWeekDirection('none'), 520); }}
                    aria-label="Semana anterior"
                    style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#2a2a2a', color: '#fff', cursor: 'pointer' }}
                  >
                    ‹
                  </button>
                  <h3 style={{ margin: 0 }}>Calendario</h3>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{`${weekStart.toLocaleDateString()} — ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`}</div>
                  <button
                    onClick={() => { setWeekDirection('next'); setWeekOffset((s) => s + 1); setTimeout(() => setWeekDirection('none'), 520); }}
                    aria-label="Semana siguiente"
                    style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#2a2a2a', color: '#fff', cursor: 'pointer' }}
                  >
                    ›
                  </button>
                  {/* consultorios dropdown */}
                  <select value={selectedConsultorioId ?? ''} onChange={(e) => setSelectedConsultorioId(e.target.value ? Number(e.target.value) : null)} style={{ background: '#222', color: '#fff', border: '1px solid #333', padding: '6px 8px', borderRadius: 6, marginLeft: 8 }}>
                    <option value="">Todos los consultorios</option>
                    {consultorios.map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.nombre || `Consultorio ${c.id}`}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {canUpload && (
                  <button
                    onClick={() => setShowUpload(true)}
                    onMouseEnter={() => setHoverUpload(true)}
                    onMouseLeave={() => setHoverUpload(false)}
                    style={{
                      background: hoverUpload ? '#3a3a3a' : '#2a2a2a',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      transform: hoverUpload ? 'translateY(-3px)' : 'none',
                      boxShadow: hoverUpload ? '0 8px 20px rgba(0,0,0,0.24)' : 'none',
                    }}
                  >
                    Subir Excel
                  </button>
                  )}
                  {canCreateReplacementGlobal && (
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
                  )}
                  {canCreateHoraryGlobal && (
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
                  )}
                 </div>
               </div>
              <CalendarGrid
                weekStart={weekStart}
                weekDirection={weekDirection}
                horaries={horaries}
                onCreate={canCreateHoraryGlobal ? handleGridCreate : undefined}
                onDelete={handleGridDeleteRequest}
                onReplace={handleGridReplaceRequest}
                onDeleteReplacement={handleDeleteReplacementRequest}
                onDeleteFalta={handleDeleteFaltaRequest}
                onActionRequest={handleGridActionRequest}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
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
        initialConsultorioId={selectedConsultorioId}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        endpoint={'/horarios/upload'}
        fieldName={'file'}
        onUploaded={() => { loadHoraries(); toast.success('Horarios importados', { autoClose: 1600 }); }}
      />

      <CreateReplacementModal
        visible={showReplacement}
        onClose={() => { setShowReplacement(false); setInitialReplacementHoraryId(undefined); }}
        weekStart={weekStart}
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

          // include occurrence_date if provided so backend stores replacement for that date
          const payload: any = { name: p.name, last_name: p.last_name, start_time, end_time };
          if ((p as any).occurrence_date) payload.occurrence_date = (p as any).occurrence_date;

          createReplacement(p.horaryId, payload).then((res) => {
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
            const status = e?.response?.status;
            if (status === 403 || status === 401) {
              toast.error('No estás autorizado para crear reemplazos en este horario', { autoClose: 1500 });
            } else {
              toast.error('No se pudo crear el reemplazo', { autoClose: 1500 });
            }
          }).finally(() => setCreatingReplacement(false));
         }}
         loading={creatingReplacement}
         horaries={horaries}
         initialHoraryId={initialReplacementHoraryId}
       />

      {/* modal to create falta */}
      <CreateFaltaModal
        visible={showFaltaModal}
        onClose={() => setShowFaltaModal(false)}
        onCreate={(p) => {
          setCreatingFalta(true);
          createFalta(p.horaryId, { reason: p.reason, occurrence_date: p.occurrence_date }).then((res) => {
            // update local state: append falta to corresponding horary
            const created = res?.data;
            if (created) {
              setHoraries((s) => s.map(h => h.id === p.horaryId ? { ...h, faltas: [...(Array.isArray(h.faltas) ? h.faltas : (h.faltas ? [h.faltas] : [])), created], falta: created } : h));
            }
            setShowFaltaModal(false);
            toast.success('Falta creada', { autoClose: 1400 });
          }).catch((e) => {
            console.error('failed to create falta', e);
            const status = e?.response?.status;
            if (status === 403 || status === 401) {
              toast.error('No estás autorizado para crear esta falta', { autoClose: 1500 });
            } else {
              toast.error('No se pudo crear la falta', { autoClose: 1500 });
            }
          }).finally(() => setCreatingFalta(false));
        }}
        loading={creatingFalta}
        horaries={horaries}
        initialHoraryId={actionHorary?.id}
        weekStart={weekStart}
      />

      {/* Delete confirmation modal (reusable) */}
      {(() => {
        const isReplacement = !!selectedToDelete?._isReplacement;
        const isFalta = !!selectedToDelete?._isFalta;
        const parentHorary = isFalta ? horaries.find(h => h.id === selectedToDelete?.horary_id) : null;

        const title = isReplacement ? 'Confirmar eliminación de reemplazo' : isFalta ? 'Confirmar eliminación de falta' : 'Confirmar eliminación';
        const message = isReplacement ? (
          <div>¿Eliminar el reemplazo "{selectedToDelete?.name} {selectedToDelete?.last_name}" del horario seleccionado?</div>
        ) : isFalta ? (
          <div>¿Eliminar la falta "{selectedToDelete?.reason || 'sin motivo'}" para el horario <strong>{parentHorary?.title || parentHorary?.name || `${parentHorary ? (parentHorary.start_time || parentHorary.start) : '-'} - ${parentHorary ? (parentHorary.end_time || parentHorary.end) : '-'}`}</strong>?</div>
        ) : (
          <div>¿Eliminar el horario "{selectedToDelete?.title || selectedToDelete?.name || 'Horario'}" ({selectedToDelete?.start_time || selectedToDelete?.start} - {selectedToDelete?.end_time || selectedToDelete?.end})?</div>
        );
        const confirmLabel = isReplacement ? 'Eliminar reemplazo' : isFalta ? 'Eliminar falta' : 'Eliminar';

        return (
          <ConfirmModal
            visible={showDeleteConfirm}
            title={title}
            message={message}
            onCancel={() => { setShowDeleteConfirm(false); setSelectedToDelete(null); }}
            onConfirm={handleConfirm}
            loading={deleting}
            cancelLabel="Cancelar"
            confirmLabel={confirmLabel}
          />
        );
      })()}

      {/* action choice modal (simple) */}
      {showActionChoice && actionHorary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400 }}>
          <div style={{ width: 380, background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 18, position: 'relative' }}> 
            {/* close X top-right */}
            <button
              onClick={() => setShowActionChoice(false)}
              aria-label="Cerrar"
              style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 18 }}
            >
              ×
            </button>

            <h3 style={{ marginTop: 0 }}>Acción</h3>
            <div>Seleccioná una acción para el horario: <strong>{actionHorary.title || actionHorary.name || `${actionHorary.start_time || actionHorary.start} - ${actionHorary.end_time || actionHorary.end}`}</strong></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button
                onClick={() => setShowActionChoice(false)}
                onMouseEnter={() => setHoverActionCancel(true)}
                onMouseLeave={() => setHoverActionCancel(false)}
                style={{
                  background: hoverActionCancel ? '#2a2a2a' : 'transparent',
                  color: hoverActionCancel ? '#fff' : '#ddd',
                  border: '1px solid #333',
                  padding: '8px 10px',
                  borderRadius: 6,
                  transform: hoverActionCancel ? 'translateY(-4px)' : 'none',
                  transition: 'all 140ms ease',
                  boxShadow: hoverActionCancel ? '0 8px 20px rgba(0,0,0,0.28)' : 'none',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleOpenReplacementFromChoice}
                onMouseEnter={() => setHoverActionReplace(true)}
                onMouseLeave={() => setHoverActionReplace(false)}
                style={{
                  background: hoverActionReplace ? '#2b8a3e' : '#32a84b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: 6,
                  transform: hoverActionReplace ? 'translateY(-4px)' : 'none',
                  transition: 'all 140ms ease',
                  boxShadow: hoverActionReplace ? '0 12px 30px rgba(50,168,75,0.18)' : 'none',
                }}
              >
                Crear reemplazo
              </button>

              <button
                onClick={handleOpenFaltaFromChoice}
                onMouseEnter={() => setHoverActionFalta(true)}
                onMouseLeave={() => setHoverActionFalta(false)}
                style={{
                  background: hoverActionFalta ? '#b43f3f' : '#d64545',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: 6,
                  transform: hoverActionFalta ? 'translateY(-4px)' : 'none',
                  transition: 'all 140ms ease',
                  boxShadow: hoverActionFalta ? '0 12px 30px rgba(180,63,63,0.18)' : 'none',
                }}
              >
                Crear falta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* react-toastify handles toasts globally (ToastContainer in main.tsx) */}
    </div>
  );
}
