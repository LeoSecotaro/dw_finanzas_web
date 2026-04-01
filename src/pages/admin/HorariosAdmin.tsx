import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import { listHorarios, updateHorario, deleteHorario } from '../../api/horariosApi';
import { FaPen, FaTimes, FaEye } from 'react-icons/fa';
import FormModal from '../../components/modals/FormModal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HorariosAdmin() {
  const [horarios, setHorarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState<any | null>(null);
  const [viewing, setViewing] = React.useState<any | null>(null);
  const [saving, setSaving] = React.useState(false);

  // server-side list controls
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  // option to include past-month horarios from backend
  const [showPast, setShowPast] = React.useState(false);

  // helper: format date or fallback to raw string (human-friendly)
  const formatDate = (val: any) => {
    try {
      if (!val) return '-';
      const d = new Date(String(val));
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString();
    } catch (e) { return String(val); }
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = { page, per_page: perPage };
        if (q) params.q = q;
        // request backend to include past schedules when requested
        if (showPast) params.include_past = true;
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
        // if backend includes past items by default, allow client-side filtering
        const nowStart = new Date(); nowStart.setHours(0,0,0,0);
        const isPastItem = (item: any) => {
          const dateStr = item?.end_date || item?.start_date || item?.end || item?.start || item?.date;
          if (!dateStr) return false; // keep if no date info
          const d = new Date(String(dateStr));
          if (isNaN(d.getTime())) return false;
          return d < nowStart;
        };
        const filtered = showPast ? list : list.filter(i => !isPastItem(i));
        setHorarios(filtered);

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
  }, [q, page, perPage, showPast]);

  const columns = React.useMemo(() => {
    if (!horarios || horarios.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: '__actions', label: '' }];
    const first = horarios[0];
    // exclude nested details and heavy fields so the table stays clean
    const excludeKeys = ['replacements', 'faltas', 'reemplazos', 'replacements_list', 'horarios', 'imagenes', 'images', 'image'];
    const keys = Object.keys(first).filter(k => !excludeKeys.includes(k));
    // label dictionary for specific backend keys
    const labelMap: Record<string, string> = { month: 'Mes', current: 'Actual', start_date: 'Fecha inicio', '__actions': 'Acciones' };
    const cols = keys.map((k) => ({ key: k, label: labelMap[k] ?? k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
    return cols.concat([{ key: '__actions', label: labelMap['__actions'] ?? '' }]);
  }, [horarios]);

  const handleEdit = (row: any) => setEditing(row);

  const renderCell = (row: any, key: string) => {
    if (key === '__actions') {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setViewing(row)} title="Ver" style={{ padding: 8, background: 'transparent', color: '#555', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            <FaEye />
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
            <label style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#ddd' }}>
              <input type="checkbox" checked={showPast} onChange={(e) => { setShowPast(e.target.checked); setPage(1); }} /> Mostrar antiguos
            </label>
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

        {/* Modal to view nested horarios inside a grouped month row */}
        {viewing && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setViewing(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: '98%', maxHeight: '80%', overflow: 'auto', background: '#fff', color: '#000', borderRadius: 8, padding: 14, boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Horarios del mes {viewing.month || viewing.start_date || viewing.name || ''}</div>
                <button onClick={() => setViewing(null)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#000', fontWeight: 700 }}>×</button>
              </div>
              {(Array.isArray(viewing.horarios) ? viewing.horarios : (Array.isArray(viewing.items) ? viewing.items : [] as any[])).length === 0 && (
                <div style={{ color: '#555' }}>No hay horarios detallados para este mes.</div>
              )}
              {(Array.isArray(viewing.horarios) ? viewing.horarios : (Array.isArray(viewing.items) ? viewing.items : [])).map((hr: any, i: number) => (
                <div key={hr.id || i} style={{ padding: 10, borderRadius: 8, background: '#f7f7f7', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{hr.title || hr.name || hr.note || `Horario ${hr.id || i}`}</div>
                      <div style={{ color: '#444' }}>{hr.start_date ? hr.start_date + ' ' : ''}{hr.start_time || hr.start || '-'} — {hr.end_date ? hr.end_date + ' ' : ''}{hr.end_time || hr.end || '-'}</div>
                      {hr.day && <div style={{ color: '#666' }}>Día: {String(hr.day)}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={() => handleEdit(hr)} title="Editar horario" style={{ padding: 6, background: 'transparent', color: '#1976d2', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaPen /></button>
                        <button onClick={() => setDeleting(hr)} title="Borrar horario" style={{ padding: 6, background: 'transparent', color: '#d32f2f', border: 'none', borderRadius: 6, cursor: 'pointer' }}><FaTimes /></button>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {((hr.replacements && hr.replacements.length) || hr.replacement) ? (
                          <div style={{ color: '#1b8a3e' }}>Reemplazos: {Array.isArray(hr.replacements) ? hr.replacements.length : (hr.replacement ? 1 : 0)}</div>
                        ) : null}
                        {((hr.faltas && hr.faltas.length) || hr.falta) ? <div style={{ color: '#c0392b' }}>Faltas: {Array.isArray(hr.faltas) ? hr.faltas.length : (hr.falta ? 1 : 0)}</div> : null}
                      </div>
                    </div>
                  </div>
                  {/* show replacements/faltas brief */}
                  {((hr.replacements && hr.replacements.length) || hr.replacement) && (
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #eee' }}>
                      <div style={{ fontWeight: 600 }}>Reemplazos</div>
                      {(Array.isArray(hr.replacements) ? hr.replacements : [hr.replacement]).map((r: any, j: number) => (
                        <div key={j} style={{ paddingTop: 8, color: '#333', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 110, color: '#666' }}>
                            <div style={{ fontSize: 12 }}>Fecha</div>
                            <div style={{ fontWeight: 600 }}>{formatDate(r.occurrence_date || r.date || r.fecha)}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12 }}>Reemplazante</div>
                            <div style={{ fontWeight: 600 }}>{r.name || r.apodo || r.first_name || r.worker_name || 'Sin nombre'}</div>
                            <div style={{ color: '#444' }}>{(r.start_time || r.start || '') + (r.end_time || r.end ? ` — ${r.end_time || r.end}` : '')}</div>
                            {r.note && <div style={{ marginTop: 6, color: '#444' }}><strong>Observaciones:</strong> {String(r.note)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* show faltas (absences) in a readable card format, similar to reemplazos */}
                  {((hr.faltas && hr.faltas.length) || hr.falta) && (
                    <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #f5d6d6' }}>
                      <div style={{ fontWeight: 600, color: '#c0392b' }}>Faltas</div>
                      {(Array.isArray(hr.faltas) ? hr.faltas : [hr.falta]).map((f: any, k: number) => (
                        <div key={k} style={{ paddingTop: 8, color: '#333', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 110, color: '#666' }}>
                            <div style={{ fontSize: 12 }}>Fecha</div>
                            <div style={{ fontWeight: 600 }}>{formatDate(f.occurrence_date || f.date || f.fecha || f.absence_date || f.fecha_inicio)}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12 }}>Empleado</div>
                            <div style={{ fontWeight: 600 }}>{f.name || f.worker_name || f.apodo || f.first_name || 'Sin nombre'}</div>
                            <div style={{ color: '#444' }}>{(f.start_time || f.start || '') + (f.end_time || f.end ? ` — ${f.end_time || f.end}` : '')}</div>
                            {(f.reason || f.motivo || f.note || f.notes) && (
                              <div style={{ marginTop: 6, color: '#444' }}>
                                <strong>Motivo:</strong> {String(f.reason || f.motivo || f.note || f.notes)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
