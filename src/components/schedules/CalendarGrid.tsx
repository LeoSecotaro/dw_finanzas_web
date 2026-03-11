import React, { useEffect, useState } from 'react';
import { listDays } from '../../api/daysApi';
import type { DayItem } from '../../api/daysApi';

// week view calendar that paints schedule blocks per-hour
export default function CalendarGrid({ horaries = [], onCreate, onDelete, onReplace, onDeleteReplacement }: { horaries?: any[], onCreate?: (data: { day_id: number; start_time: string; end_time?: string }) => void, onDelete?: (hr: any) => void, onReplace?: (hr: any) => void, onDeleteReplacement?: (replacement: any, horaryId: number) => void }) {
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

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#2d2d2d', color: '#fff', borderRadius: 8, padding: innerPadding, width: '100%', maxWidth: 1800, margin: '0 auto', boxSizing: 'border-box', minHeight: cardMinHeight }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {days.map((d) => <div key={d.id} style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>{d.short_name || d.name || d.id}</div>)}
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
          {days.map((day) => (
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
                  const dayHoraries = (horaries || []).filter((hr: any) => {
                    const hrDayId = hr.day_id ?? undefined;
                    const hrDayStr = hr.day ? String(hr.day).toLowerCase() : undefined;
                    return (hrDayId && hrDayId === day.id) || (hrDayStr && hrDayStr.startsWith(dayShort));
                  });

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
                      const replacement = (Array.isArray(hr.replacements) && hr.replacements.length)
                        ? hr.replacements[hr.replacements.length - 1]
                        : (hr.replacement || null);

                      // choose background color: pending -> gray, finished/terminated -> light green, replaced -> green, else default blue
                      const isReplaced = !!replacement;
                      const bg = hr._pending
                        ? '#bfbfbf'
                        : (isReplaced ? '#32a84b' : (hr.color || (hr.status === 'finished' || hr.state === 'terminated' ? '#b6f0c8' : '#1677ff')));
                      const textColor = (bg === '#b6f0c8' || bg === '#bfbfbf') ? '#0b0b0b' : '#fff';

                      const overlapOffset = (item.colIndex || 0) * 6; // offset only when necessary
                      const isBlockHovered = hoveredBlock === key;
                      const hoverTransform = isBlockHovered ? 'translateY(-6px)' : 'none';
                      const hoverShadow = isBlockHovered ? '0 12px 30px rgba(0,0,0,0.35)' : '0 4px 10px rgba(0,0,0,0.12)';

                      const title = hr.title || hr.name || hr.note || hr.description;
                      // if replaced, show 'Reemplazo: Nombre Apellido'; otherwise show status/subtitle
                      const subtitle = isReplaced
                        ? `Reemplazo: ${(replacement.name || '').toString().trim()}${replacement.last_name ? ' ' + replacement.last_name : ''}`
                        : (hr.status || hr.state || (hr._pending ? 'Pendiente' : undefined));

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
                            boxShadow: hoverShadow,
                            overflow: 'hidden',
                            zIndex: isBlockHovered ? 30 : 5,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            cursor: onReplace ? 'pointer' : (onDelete ? 'pointer' : 'default'),
                            transition: 'all 180ms ease',
                            transform: hoverTransform,
                          }}
                          title={`${title}${subtitle ? ' — ' + subtitle : ''} (${hr.start_time || hr.start} - ${hr.end_time || hr.end})`}
                          onClick={(e) => { e.stopPropagation(); if (onReplace) onReplace(hr); }}
                        >
                           {/* delete X button top-right inside block */}
                           {onDelete && (
                             <button
                               onClick={(ev) => { ev.stopPropagation(); // if replaced, ask to delete replacement, else delete horary
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
    </div>
  );
}
