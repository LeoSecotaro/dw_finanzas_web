import React, { useEffect, useState } from 'react';
import { listDays } from '../../api/daysApi';
import type { DayItem } from '../../api/daysApi';

// week view calendar that paints schedule blocks per-hour
export default function CalendarGrid({ horaries = [], onCreate, onDelete, onReplace, onDeleteReplacement, onDeleteFalta, onActionRequest, weekStart, weekDirection = 'none' }: { horaries?: any[], onCreate?: (data: { day_id: number; start_time: string; end_time?: string }) => void, onDelete?: (hr: any) => void, onReplace?: (hr: any) => void, onDeleteReplacement?: (replacement: any, horaryId: number) => void, onDeleteFalta?: (falta: any, horaryId: number) => void, onActionRequest?: (hr: any) => void, weekStart?: Date, weekDirection?: 'next'|'prev'|'none' }) {
  const defaultShort = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const [days, setDays] = useState<DayItem[]>(defaultShort.map((d, i) => ({ id: i + 1, short_name: d })));

  const startHour = 6; // visible from 06:00
  const hours = Array.from({ length: 24 - startHour }, (_, i) => `${(startHour + i).toString().padStart(2, '0')}:00`);

  // helper: minutes -> 'HH:MM'
  const minutesToTimeString = (mins: number) => {
    const m = Math.max(0, mins % (24 * 60));
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // increase slotHeight to make the grid taller (rows bigger)
  const slotHeight = 36;
  const headerHeight = 28; // top header inside card
  const innerPadding = 12; // outer card padding
  const columnPadding = 6; // padding inside each day column
  const containerHeight = slotHeight * hours.length; // area for hour rows
  const innerContentHeight = headerHeight + containerHeight; // content inside column (header + rows)
  const cardMinHeight = innerContentHeight + innerPadding * 2; // card minHeight to cover everything

  useEffect(() => {
    listDays().then((r) => {
      const items: DayItem[] = r.data || [];
      if (items && items.length) setDays(items);
    }).catch(() => {
      // keep defaults
    });
  }, []);

  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  // control per-block entrance animation (staggered)
  const [blocksEntering, setBlocksEntering] = useState(true);

  // internal modal state to show details of a selected horary when user clicks a block
  const [selectedHorary, setSelectedHorary] = useState<any | null>(null);

  const parseTime = (t: string) => {
    if (!t) return 0;
    // try to extract HH:MM from ISO datetime like 2000-01-01T14:00:00.000Z or plain '14:00'
    const m = String(t).match(/(\d{2}):(\d{2})/);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
    }
    // fallback: try split
    const [hhRaw, mmRaw] = (t || '00:00').split(':');
    const hh = Number(hhRaw);
    const mm = Number(mmRaw || '0');
    return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
  };

  // normalize apodo/key from a horary object (supports several shapes)
  const getNormalizedApodo = (h: any) => {
    if (!h) return '';
    // accept several common id shapes returned by different backends
    const userId = h.user_id ?? h.userId ?? h.user?.id ?? null;
    const workerId = h.worker_id ?? h.workerId ?? h.worker?.id ?? null;

    const candidates = [
      h.apodo, h.nickname, h.alias, h.apodo_name,
      h.worker?.apodo, h.worker?.nickname, h.worker?.apodo_name,
      h.user?.apodo, h.user?.nickname,
      // prefer stable id fallback so workers without apodo still get consistent colors
      userId ? `user_${userId}` : undefined,
      workerId ? `worker_${workerId}` : undefined,
      (h.name || h.first_name || '') + ' ' + (h.last_name || '')
    ];
    const found = candidates.find(c => c !== undefined && c !== null && String(c).trim() !== '');
    return found ? String(found).trim().toLowerCase() : '';
  };

  // map apodo (nickname) -> unique color
  const apodoColorMap = React.useMemo(() => {
    const items = (horaries || []).map((h: any) => getNormalizedApodo(h)).filter(Boolean);
    const apodos = Array.from(new Set(items));
    // base palette (vibrant, readable on dark background)
    const basePalette = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#8a2be2', '#ff7f50', '#00b894', '#e84393', '#fd7e14', '#00cec9', '#6c5ce7', '#2ec4b6', '#ff6b6b', '#845ec2'];
    const palette: string[] = basePalette.slice();
    if (apodos.length > palette.length) {
      // generate more colors using golden-angle spacing in HSL
      const needed = apodos.length - palette.length;
      for (let i = 0; i < needed; i++) {
        const hue = Math.round((i * 137.508) % 360); // golden angle
        palette.push(`hsl(${hue} 70% 50%)`);
      }
    }
    // shuffle palette for a random distribution each mount
    for (let i = palette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [palette[i], palette[j]] = [palette[j], palette[i]];
    }
    const map: Record<string, string> = {};
    apodos.forEach((a, i) => { map[a] = palette[i]; });
    // debug: show detected apodos and assigned colors in console
    try { console.debug('CalendarGrid apodos detected', apodos, 'apodoColorMap', map); } catch (e) { /* ignore */ }
    return map;
  }, [horaries]);

  // deterministic color generator for any string (fallback)
  const generateColorFromString = (str: string) => {
    // djb2 hash
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // keep as 32-bit int
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 65% 50%)`;
  };

  // animation state for week transitions (use percentage translate for clear slide)
  const [animStyle, setAnimStyle] = useState({ transform: 'translateX(0%)', opacity: 1 });

  React.useEffect(() => {
    if (weekDirection && weekDirection !== 'none') {
      const offsetPercent = weekDirection === 'next' ? 100 : -100;
      // start container off-screen and hide block entrances
      setAnimStyle({ transform: `translateX(${offsetPercent}%)`, opacity: 0 });
      setBlocksEntering(false);
      // animate container into place and then trigger staggered block entrances
      requestAnimationFrame(() => {
        setAnimStyle({ transform: 'translateX(0%)', opacity: 1 });
        // small delay so container starts moving first, then blocks animate
        setTimeout(() => setBlocksEntering(true), 90);
      });
    } else {
      // initial mount / no direction -> ensure blocks visible
      setBlocksEntering(true);
      setAnimStyle({ transform: 'translateX(0%)', opacity: 1 });
    }
  }, [weekStart, weekDirection]);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ background: '#2d2d2d', color: '#fff', borderRadius: 8, padding: innerPadding, width: '100%', maxWidth: 1800, margin: '0 auto', boxSizing: 'border-box', minHeight: cardMinHeight, transform: animStyle.transform, opacity: animStyle.opacity, transition: 'transform 420ms cubic-bezier(.2,.9,.3,1), opacity 320ms ease', willChange: 'transform, opacity' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {days.map((d, idx) => {
            const dateStr = weekStart ? new Date(weekStart.getTime() + idx * 24 * 60 * 60 * 1000).toLocaleDateString() : null;
            return (
              <div key={d.id} style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>
                <div>{d.short_name || d.name || d.id}</div>
                {dateStr && <div style={{ fontSize: 11, color: '#bbb' }}>{dateStr}</div>}
              </div>
            );
          })}
        </div>

        {/* content container: force explicit height so grid stretches */}
        <div style={{ display: 'flex', gap: 12, height: innerContentHeight }}>
          {/* left label column */}
          <div style={{ width: 80, height: '100%' }}>
            <div style={{ height: headerHeight }} />
            <div style={{ height: containerHeight, boxSizing: 'border-box' }}>
              {hours.map((h) => (
                // make label row exactly slotHeight and center text vertically
                <div key={h} style={{ color: '#bbb', fontSize: 11, height: slotHeight, display: 'flex', alignItems: 'center' }}>{h}</div>
              ))}
            </div>
          </div>

          {/* day columns */}
          {days.map((day, dayIdx) => (
            <div key={day.id} style={{ flex: 1, minWidth: 180, position: 'relative', height: '100%' }}>
              <div style={{ height: '100%', background: '#2f2f2f', borderRadius: 6, padding: columnPadding, boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ height: headerHeight }} />

                {/* hour rows container: visually render slots so grid appears */}
                <div style={{ height: containerHeight, boxSizing: 'border-box' }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      style={{ height: slotHeight, display: 'flex', alignItems: 'center', cursor: onCreate ? 'pointer' : 'default' }}
                      onMouseEnter={() => setHoveredSlot(`${day.id}_${h}`)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => {
                        if (!onCreate) return;
                        // default end_time = start + 60min
                        const start = h;
                        const end = minutesToTimeString(parseTime(h) + 60);
                        onCreate({ day_id: day.id, start_time: start, end_time: end });
                      }}
                    >
                      {(() => {
                        const key = `${day.id}_${h}`;
                        const isHovered = hoveredSlot === key;
                        // darker gray on hover instead of blue
                        const bg = isHovered ? '#2a2a2a' : '#363636';
                        const transform = isHovered ? 'translateY(-4px)' : 'none';
                        const boxShadow = isHovered ? '0 10px 24px rgba(0,0,0,0.35)' : 'none';
                        return (
                          <div style={{ height: slotHeight - 10, background: bg, borderRadius: 6, width: '100%', transition: 'all 180ms ease', transform, boxShadow }} />
                        );
                      })()}
                    </div>
                  ))}

                </div>

                {/* Floating absolute blocks: draw each horary as a positioned card over the hour grid */}
                {(() => {
                  const dayShort = (day.short_name || day.name || '').toString().toLowerCase();

                  // helper: parse a date-like value into a date-only (midnight local) object
                  const parseDateOnly = (val: any) => {
                    if (!val) return null;
                    // If it's already a Date, normalize to local date (midnight)
                    if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
                    const s = String(val);
                    // prefer extracting YYYY-MM-DD to avoid timezone shifts from ISO strings
                    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
                    if (m) {
                      const year = Number(m[1]);
                      const month = Number(m[2]);
                      const day = Number(m[3]);
                      if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
                        return new Date(year, month - 1, day);
                      }
                    }
                    // fallback to Date parsing, then normalize
                    const d = new Date(s);
                    if (isNaN(d.getTime())) return null;
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  };

                  // helper: determine if a horary is active for a given calendar date
                  // if horary has end_date (and optional start_date), only show when the column date
                  // falls within [start_date, end_date]. If no date bounds are provided, keep showing.
                  const isHoraryActiveOnDate = (hr: any, date: Date | null) => {
                    if (!date) return true; // cannot filter without a column date
                    if (!hr) return false;
                    // if no bounds present, assume global/always-active
                    if (!hr.end_date && !hr.start_date) return true;
                    const end = parseDateOnly(hr.end_date);
                    const start = parseDateOnly(hr.start_date) || (end ? new Date(end.getFullYear(), end.getMonth(), 1) : null);
                    if (!end && !start) return true;
                    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    if (start && end) return d >= start && d <= end;
                    if (end) return d >= new Date(end.getFullYear(), end.getMonth(), 1) && d <= end;
                    if (start) return d >= start;
                    return true;
                  };

                  // compute the actual calendar date for this column
                  const ms = 24 * 60 * 60 * 1000;
                  const columnDate = weekStart ? new Date(weekStart.getTime() + dayIdx * ms) : null;
                  // normalize column date to midnight and determine if it's in the past
                  const columnDateNormalized = columnDate ? new Date(columnDate.getFullYear(), columnDate.getMonth(), columnDate.getDate()) : null;
                  const todayDate = new Date(); todayDate.setHours(0,0,0,0);
                  const columnIsPast = columnDateNormalized ? (columnDateNormalized < todayDate) : false;

                  const dayHoraries = (horaries || []).filter((hr: any) => {
                    const hrDayId = hr.day_id ?? undefined;
                    const hrDayStr = hr.day ? String(hr.day).toLowerCase() : undefined;
                    const matchesDay = (hrDayId && hrDayId === day.id) || (hrDayStr && hrDayStr.startsWith(dayShort));
                    if (!matchesDay) return false;
                    // only show if horary is active on the column date (month-aware)
                    return isHoraryActiveOnDate(hr, columnDate);
                  });

                  // debug: when nothing is shown, log a short summary to help trace the issue
                  try {
                    if ((horaries || []).length && (!dayHoraries || dayHoraries.length === 0)) {
                      console.debug('CalendarGrid debug: no horaries for column', { columnDate: columnDate ? columnDate.toISOString().slice(0,10) : null, dayId: day.id, dayShort, horariesSample: (horaries || []).slice(0,4).map(h=>({ id: h.id, day_id: h.day_id, start_date: h.start_date, end_date: h.end_date })) });
                    }
                  } catch (e) { /* ignore logging errors */ }

                  return (() => {
                    // build sorted list with numeric times
                    const sorted = dayHoraries.map((hr: any) => ({ hr, s: parseTime(hr.start_time ?? hr.start), e: parseTime(hr.end_time ?? hr.end) }))
                      .sort((a: any, b: any) => a.s - b.s);

                    const columnsEnd: number[] = [];
                    const positioned: Array<{ hr: any; s: number; e: number; colIndex: number }> = [];

                    sorted.forEach((item) => {
                      // find first column that is free (no overlap)
                      let assigned = columnsEnd.findIndex((end) => item.s >= end);
                      if (assigned === -1) {
                        assigned = columnsEnd.length;
                        columnsEnd.push(item.e);
                      } else {
                        // extend column end if this event ends later
                        columnsEnd[assigned] = Math.max(columnsEnd[assigned], item.e);
                      }
                      positioned.push({ hr: item.hr, s: item.s, e: item.e, colIndex: assigned });
                    });

                    return positioned.map((item, idx) => {
                      const hr = item.hr;
                      // debug per-block apodo
                      try { console.debug('CalendarGrid block', hr.id, 'normalizedApodo', getNormalizedApodo(hr)); } catch (e) { /* ignore */ }
                      const s = item.s;
                      const e = item.e;

                      const key = `${hr.id ?? idx}-${day.id}`;

                      const visibleStart = startHour * 60;
                      const totalVisibleMinutes = (24 - startHour) * 60;
                      const pixelsPerMinute = containerHeight / totalVisibleMinutes;

                      const topPx = Math.max(0, (s - visibleStart) * pixelsPerMinute);
                      const rawHeightPx = Math.max(12, (e - s) * pixelsPerMinute);
                      const maxHeight = Math.max(0, containerHeight - topPx);
                      const heightPx = Math.min(rawHeightPx, maxHeight);

                      // detect replacement on this horary (API may return replacements array or single replacement)
                      // if weekStart provided, prefer replacements whose occurrence_date matches the current column date
                      const ms = 24 * 60 * 60 * 1000;
                      const dayDateISO = weekStart ? new Date(weekStart.getTime() + dayIdx * ms).toISOString().slice(0,10) : null;
                      const reps = Array.isArray(hr.replacements) ? hr.replacements : (hr.replacements ? [hr.replacements] : []);
                      let replacement: any = null;
                      if (reps && reps.length) {
                        if (dayDateISO) {
                          replacement = reps.find((r: any) => (r.occurrence_date ? String(r.occurrence_date) === dayDateISO : false)) || null;
                        } else {
                          replacement = reps[reps.length - 1];
                        }
                      } else {
                        replacement = hr.replacement || null;
                      }

                      // faltas (absences): API may return hr.faltas array or hr.falta
                      const faltas = Array.isArray(hr.faltas) ? hr.faltas : (hr.faltas ? [hr.faltas] : []);
                      let falta: any = null;
                      if (faltas && faltas.length) {
                        if (dayDateISO) {
                          falta = faltas.find((f: any) => (f.occurrence_date ? String(f.occurrence_date) === dayDateISO : false)) || null;
                        } else {
                          falta = faltas[faltas.length - 1];
                        }
                      } else {
                        falta = hr.falta || null;
                      }

                      const isReplaced = !!replacement;
                      const isFalta = !!falta;

                      // compute color per apodo/user fallback
                      const apodoNorm = getNormalizedApodo(hr) || null;
                      let apodoColor = null;
                      if (apodoNorm) {
                        apodoColor = apodoColorMap[apodoNorm] || generateColorFromString(apodoNorm);
                      }

                      // if there's a falta (absence), show in red and preferred over replacement
                      const bg = hr._pending
                        ? '#bfbfbf'
                        : (isFalta ? '#d64545' : (isReplaced ? '#32a84b' : (apodoColor || hr.color || (hr.status === 'finished' || hr.state === 'terminated' ? '#b6f0c8' : '#1677ff'))));
                      const textColor = (bg === '#b6f0c8' || bg === '#bfbfbf') ? '#0b0b0b' : '#fff';

                      const overlapOffset = (item.colIndex || 0) * 6; // offset only when necessary
                      const isBlockHovered = hoveredBlock === key;
                      // entrance animation / stagger
                      const entryDelay = idx * 40 + 80; // ms per block
                      const isEntered = blocksEntering;
                      const entranceTransform = isEntered ? 'none' : 'translateY(12px) scale(0.995)';
                      const hoverTransform = isBlockHovered ? 'translateY(-6px)' : 'none';
                      // combine hover with entrance: hover should win when active
                      const appliedTransform = isBlockHovered ? hoverTransform : entranceTransform;
                      const entryShadow = isBlockHovered ? '0 12px 30px rgba(0,0,0,0.35)' : (isEntered ? '0 4px 10px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.06)');

                      const title = hr.title || hr.name || hr.note || hr.description || '';
                      // if replaced, show 'Reemplazo: Nombre Apellido'; otherwise show status/subtitle
                      const subtitle = isFalta
                        ? `Falta: ${(falta?.reason || falta?.motivo || '').toString().trim()}`
                        : (isReplaced
                          ? `Reemplazo: ${(replacement?.name || '').toString().trim()}${replacement?.last_name ? ' ' + replacement.last_name : ''}`
                          : (hr.status || hr.state || (hr._pending ? 'Pendiente' : undefined)));

                      return (
                        <div
                          key={key}
                          onMouseEnter={() => setHoveredBlock(key)}
                          onMouseLeave={() => setHoveredBlock(null)}
                          style={{
                            position: 'absolute',
                            left: columnPadding + overlapOffset,
                            right: columnPadding,
                            top: headerHeight + columnPadding + topPx,
                            height: Math.max(10, heightPx),
                            background: bg,
                            color: textColor,
                            borderRadius: 8,
                            padding: '8px 10px',
                            boxSizing: 'border-box',
                            boxShadow: entryShadow,
                            overflow: 'hidden',
                            zIndex: isBlockHovered ? 30 : 5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            cursor: onReplace ? 'pointer' : (onDelete ? 'pointer' : 'default'),
                            transition: `transform 360ms cubic-bezier(.2,.9,.3,1), opacity 260ms ease, box-shadow 220ms ease`,
                            transitionDelay: `${entryDelay}ms`,
                            transform: appliedTransform,
                            opacity: isEntered ? 1 : 0,
                           // grey-out past dates
                           ...(columnIsPast ? { filter: 'grayscale(1) contrast(0.9)', opacity: 1 } : {}),
                           }}
                          title={`${title}${subtitle ? ' — ' + subtitle : ''} (${hr.start_time || hr.start} - ${hr.end_time || hr.end})`}
                          onClick={(e) => { e.stopPropagation();
                            // prefer parent handler if provided
                            if (onActionRequest) return onActionRequest(hr);
                            // otherwise open internal details modal so user can inspect and take actions
                            setSelectedHorary(hr);
                          }}
                        >
                           {/* delete X button top-right inside block */}
                           {onDelete && (
                             <button
                               onClick={(ev) => { ev.stopPropagation(); // if there's a falta, delete that; else if replaced, delete replacement; else delete horary
                                 if (falta && onDeleteFalta) return onDeleteFalta(falta, hr.id);
                                 if (replacement && onDeleteReplacement) return onDeleteReplacement(replacement, hr.id);
                                 if (onDelete) return onDelete(hr);
                               }}
                               aria-label="Eliminar"
                               style={{
                                 position: 'absolute',
                                 right: 8,
                                 top: 8,
                                 background: 'rgba(0,0,0,0.28)',
                                 border: 'none',
                                 color: '#fff',
                                 borderRadius: 6,
                                 padding: '6px 8px',
                                 cursor: 'pointer',
                                 fontSize: 18,
                                 lineHeight: 1,
                                 zIndex: 8,
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 transition: 'background 140ms ease, transform 140ms ease',
                               }}
                             >
                               ×
                             </button>
                           )}
                            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{title}</div>
                            {subtitle && <div style={{ fontSize: 11, opacity: 0.95 }}>{subtitle}</div>}
                          </div>
                       );
                     });
                  })();

                })()}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal details modal for a selected horary (shown when parent doesn't handle onActionRequest) */}
      {selectedHorary && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedHorary(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 520, maxWidth: '95%', background: '#1f1f1f', color: '#fff', borderRadius: 8, padding: 18, boxSizing: 'border-box', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedHorary.title || selectedHorary.name || selectedHorary.note || 'Horario'}</div>
              <button onClick={() => setSelectedHorary(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }} aria-label="Cerrar">×</button>
            </div>

            <div style={{ fontSize: 13, color: '#ddd', marginBottom: 12 }}>
              <div><strong>Inicio:</strong> {(selectedHorary.start_date ? String(selectedHorary.start_date) + ' ' : '')}{selectedHorary.start_time || selectedHorary.start || '-'}</div>
              <div><strong>Fin:</strong> {(selectedHorary.end_date ? String(selectedHorary.end_date) + ' ' : '')}{selectedHorary.end_time || selectedHorary.end || '-'}</div>
              {selectedHorary.day && <div><strong>Día:</strong> {String(selectedHorary.day)}</div>}
              {selectedHorary.apodo && <div><strong>Apodo:</strong> {String(selectedHorary.apodo)}</div>}
              {selectedHorary.user?.apodo && <div><strong>Usuario:</strong> {selectedHorary.user.apodo}</div>}
              {selectedHorary.worker?.apodo && <div><strong>Trabajador:</strong> {selectedHorary.worker.apodo}</div>}
            </div>

            {/* show replacement / falta info if present */}
            {((selectedHorary.replacements && selectedHorary.replacements.length) || selectedHorary.replacement) && (
              <div style={{ marginBottom: 10, color: '#ffdede' }}>
                <strong>Reemplazos:</strong>
                <div style={{ marginTop: 6 }}>
                  {(Array.isArray(selectedHorary.replacements) ? selectedHorary.replacements : [selectedHorary.replacement]).map((r: any, i: number) => (
                    <div key={i} style={{ padding: '6px 8px', background: '#2b2b2b', borderRadius: 6, marginTop: 6 }}>
                      <div>{r.name || r.apodo || r.user_name || JSON.stringify(r)}</div>
                      {r.occurrence_date && <div style={{ fontSize: 12, color: '#bbb' }}>{r.occurrence_date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {((selectedHorary.faltas && selectedHorary.faltas.length) || selectedHorary.falta) && (
              <div style={{ marginBottom: 10, color: '#ffdede' }}>
                <strong>Faltas:</strong>
                <div style={{ marginTop: 6 }}>
                  {(Array.isArray(selectedHorary.faltas) ? selectedHorary.faltas : [selectedHorary.falta]).map((f: any, i: number) => (
                    <div key={i} style={{ padding: '6px 8px', background: '#2b2b2b', borderRadius: 6, marginTop: 6 }}>
                      <div>{f.reason || f.motivo || JSON.stringify(f)}</div>
                      {f.occurrence_date && <div style={{ fontSize: 12, color: '#bbb' }}>{f.occurrence_date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setSelectedHorary(null)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cerrar</button>
              {onReplace && (
                <button onClick={() => { if (onReplace) onReplace(selectedHorary); setSelectedHorary(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#2b8aef', color: '#fff', cursor: 'pointer' }}>Reemplazar / Editar</button>
              )}
              {onDelete && (
                <button onClick={() => {
                  // prefer deleting falta/replacement if present
                  const reps = Array.isArray(selectedHorary.replacements) ? selectedHorary.replacements : (selectedHorary.replacements ? [selectedHorary.replacements] : (selectedHorary.replacement ? [selectedHorary.replacement] : []));
                  const faltas = Array.isArray(selectedHorary.faltas) ? selectedHorary.faltas : (selectedHorary.faltas ? [selectedHorary.faltas] : (selectedHorary.falta ? [selectedHorary.falta] : []));
                  if (faltas && faltas.length && onDeleteFalta) {
                    onDeleteFalta(faltas[0], selectedHorary.id);
                  } else if (reps && reps.length && onDeleteReplacement) {
                    onDeleteReplacement(reps[0], selectedHorary.id);
                  } else if (onDelete) {
                    onDelete(selectedHorary);
                  }
                  setSelectedHorary(null);
                }} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#d64545', color: '#fff', cursor: 'pointer' }}>Eliminar</button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
