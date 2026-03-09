import React from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

type CardConfig = {
  id: string;
  title: string;
  data: any;
};

export function CardsContainer({ cards, onRemove }: { cards: CardConfig[]; onRemove: (id: string) => void }) {
  return (
    // columns fixed to card width (320px) and centered so cards don't stretch full width
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 320px))', gap: 16, marginTop: 12, justifyContent: 'center' }}>
      {cards.map((c) => (
        <ChartCard key={c.id} card={c} onRemove={() => onRemove(c.id)} />
      ))}
    </div>
  );
}

function displayMetricName(key: string) {
   const map: Record<string, string> = {
     produccion: 'Producción',
     prestacion: 'Prestación',
     facturacion: 'Facturación',
     liquidacion: 'Liquidación',
     left: 'Left',
     right: 'Right'
   };
   return map[key] || key;
 }
 
 function CustomTooltip({ active, payload, label, nameMap }: any) {
   if (!active || !payload || !payload.length) return null;
   return (
     <div style={{ background: 'white', color: '#111', padding: 8, borderRadius: 6, minWidth: 160 }}>
       <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</div>
       {payload.map((p: any) => (
         <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
           <div style={{ fontSize: 13 }}>{(nameMap && nameMap[p.dataKey]) || displayMetricName(p.dataKey)}</div>
           <div style={{ fontWeight: 700 }}>{Number(p.value).toLocaleString()}</div>
         </div>
       ))}
     </div>
   );
 }

 function ChartCard({ card, onRemove }: { card: CardConfig; onRemove: () => void }) {
   const { title, data } = card;
   const [chartType, setChartType] = React.useState<'bar' | 'pie'>('bar');

   // Prefer rows (time series). Fallback to totals
   const rows: Array<any> = Array.isArray(data?.rows) ? data.rows : null;
   const totals = data?.totals || null;

   // Get readable totals for left/right if provided
   const leftTotal = totals?.left ?? null;
   const rightTotal = totals?.right ?? null;

   // (We don't show numeric diffs inside the charts) Read totals_diffs for per-metric percentages
   const totalsDiffs: Record<string, any> = data?.totals_diffs ?? data?.totals_diffs_by_source ?? {};
   // Fallback percent from totals for simple left/right comparisons
   const pctFromTotals = totals?.pct_diff ?? totals?.pct_from_base ?? null;

   // Build a nameMap from backend params so we can show friendly names (e.g. 'Producción') for keys like 'left'/'right' or sources
   const params = data?.params ?? {};
   const nameMap: Record<string, string> = {};
   if (params.left) nameMap['left'] = displayMetricName(params.left);
   if (params.right) nameMap['right'] = displayMetricName(params.right);
   if (params.sources && typeof params.sources === 'string') {
     params.sources.split(',').forEach((s: string) => { const key = s.trim(); if (key) nameMap[key] = displayMetricName(key); });
   }

   // Build a unified list of percent items to render (prefer totalsDiffs per-key, else fallback to effectiveTotalsPct)
   const percentItems: Array<{ key: string; pct: number | null; label: string }> = [];
   if (totalsDiffs && Object.keys(totalsDiffs).length > 0) {
     Object.keys(totalsDiffs).forEach((k) => {
       const info = totalsDiffs[k] || {};
       const pct = info.pct_from_base ?? info.pct_diff ?? info.pct ?? null;
       percentItems.push({ key: k, pct: pct != null ? Number(pct) : null, label: displayMetricName(k) });
     });
   }

   // percentItems will get a fallback insertion later using effectiveTotalsPct if needed

   // Prepare chart data and series keys
   const chartData: any[] | null = React.useMemo(() => {
     const isNumeric = (v: any) => { const n = Number(v); return Number.isFinite(n); };
     if (Array.isArray(rows)) {
       return rows.map((r: any) => {
         const name = r.name ?? r.label ?? r.period ?? r.date ?? r.key ?? '';
         const point: any = { name };
         Object.keys(r).forEach((k) => {
           // exclude label keys and any pct/diff fields
           if (['name','key','label','date','period'].includes(k)) return;
           if (/diff|pct/i.test(k)) return;
           const val = r[k];
           if (isNumeric(val)) point[k] = Number(val);
         });
         return point;
       }).filter((p) => Object.keys(p).length > 1);
     }
     if (totals) {
       const row: any = { name: params?.label ?? 'Totales' };
       let has = false;
       if (totals.left != null) { row.left = Number(totals.left); has = true; }
       if (totals.right != null) { row.right = Number(totals.right); has = true; }
       if (totals.by_source && typeof totals.by_source === 'object') {
         Object.keys(totals.by_source).forEach((k) => { row[k] = Number(totals.by_source[k]); has = true; });
       }
       if (has) return [row];
     }
     if (totalsDiffs && Object.keys(totalsDiffs).length) {
       const row: any = { name: params?.label ?? 'Totales' };
       Object.keys(totalsDiffs).forEach((k) => {
         const v = totalsDiffs[k]?.total ?? totalsDiffs[k]?.value ?? null;
         if (v != null) row[k] = Number(v);
       });
       if (Object.keys(row).length > 1) return [row];
     }
     return null;
   }, [rows, totals, totalsDiffs, params]);
 
   const seriesKeys: string[] = React.useMemo(() => {
     const excludeRe = /diff|pct/i;
     if (chartData && chartData.length) return Object.keys(chartData[0]).filter((k) => k !== 'name' && !excludeRe.test(k));
     if (totalsDiffs && Object.keys(totalsDiffs).length) return Object.keys(totalsDiffs).filter((k) => !excludeRe.test(k));
     if (params.sources && typeof params.sources === 'string') return params.sources.split(',').map((s: string) => s.trim()).filter(Boolean);
     return [];
   }, [chartData, totalsDiffs, params]);

   // Determine an effective totals percent for overlay/fallbacks (compute if backend didn't provide pct)
   const effectiveTotalsPct = React.useMemo(() => {
     const explicit = pctFromTotals != null ? Number(pctFromTotals) : null;
     if (explicit != null) return explicit;
     if (leftTotal != null && rightTotal != null && Number(rightTotal) !== 0) {
       return ((Number(leftTotal) - Number(rightTotal)) / Math.abs(Number(rightTotal))) * 100;
     }
     // try find a pct in totalsDiffs
     if (totalsDiffs && Object.keys(totalsDiffs).length) {
       const any = Object.values(totalsDiffs).find((v: any) => v && (v.pct_diff != null || v.pct_from_base != null || v.pct != null));
       if (any) return Number(any.pct_diff ?? any.pct_from_base ?? any.pct);
     }
     // try rows
     if (Array.isArray(rows)) {
       const r = rows.find((rr: any) => rr && (rr.pct_diff != null || rr.pct_from_base != null || rr.pct != null));
       if (r) return Number(r.pct_diff ?? r.pct_from_base ?? r.pct);
     }
     return null;
   }, [pctFromTotals, leftTotal, rightTotal, totalsDiffs, rows]);

   // If no per-key pct items were extracted, use the computed effectiveTotalsPct as a totals fallback
   if (effectiveTotalsPct != null) {
     const anyPctPresent = percentItems.some((it) => it.pct != null);
     if (!anyPctPresent) {
       percentItems.unshift({ key: '__totals', pct: Number(effectiveTotalsPct), label: displayMetricName(params?.right ?? params?.left ?? 'Variación') });
     }
   }

   // Colors for series (will cycle if more than provided)
   const COLORS = ['#1677ff', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4'];
   // dynamic bar size depending on number of series
   const barSize = Math.max(10, Math.floor(44 / Math.max(1, seriesKeys.length)));

   return (
     <div style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: 8, padding: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.06)', aspectRatio: '1 / 1', minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
           <strong style={{ textTransform: 'capitalize' }}>{title}</strong>
           <small style={{ color: '#bbb', fontSize: 12 }}>{(params?.obra) ? params.obra : 'Todas'}</small>
           <select value={chartType} onChange={(e) => setChartType(e.target.value as any)} style={{ marginTop: 6, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
             <option value="bar">Barras</option>
             <option value="pie">Torta</option>
           </select>
         </div>
         <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
           {/* Only show close button in header — numeric diffs/percentages are shown below as pills */}
           <button onClick={onRemove} aria-label="Cerrar tarjeta" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#fff', transition: 'transform 160ms ease, box-shadow 160ms ease' }}
             onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
             onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
             ✕
           </button>
         </div>
       </div>

       {/* Compact per-metric percentage pills (displayed separately, not part of the chart)
           Allow wrapping so pills never overflow the card; hide any tiny overflow */}
       {percentItems.length > 0 && (
         <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', maxWidth: '100%', overflow: 'visible' }}>
           {percentItems.map((item) => {
             const isPositive = item.pct != null && item.pct > 0;
             const isNegative = item.pct != null && item.pct < 0;
             return (
               <div key={item.key} style={{ background: 'rgba(20,20,20,0.9)', padding: '6px 12px', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
                 <div style={{ color: isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#ddd', fontWeight: 600 }}>{item.pct != null ? `${item.pct > 0 ? '+' : ''}${item.pct.toFixed(1)}%` : '-'}</div>
                 <div style={{ color: '#bbb', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
               </div>
             );
           })}
         </div>
       )}

       <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
         {/* For 2-series comparisons show totals diff inside the chart as overlay badge (do NOT show percent here) */}
         {((seriesKeys.length === 2) || (leftTotal != null && rightTotal != null)) && totals?.diff != null && (
           <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 9999, pointerEvents: 'none' as 'none' }}>
             <div style={{ background: 'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: 8, color: '#fff', fontSize: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
               <div style={{ fontSize: 11, color: '#bbb' }}>Diff</div>
               <div style={{ fontWeight: 700 }}>{Number(totals.diff).toLocaleString()}</div>
             </div>
           </div>
         )}
         {chartData && seriesKeys.length > 0 ? (
           chartType === 'bar' ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 6, right: 12, left: 40, bottom: 6 }} barCategoryGap="18%" barGap={6}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                 <XAxis dataKey="name" tick={{ fill: '#bbb', fontSize: 12 }} />
                 <YAxis width={60} tick={{ fill: '#bbb', fontSize: 12 }} />
                 <Tooltip content={<CustomTooltip nameMap={nameMap} />} />
                 {seriesKeys.map((k, idx) => (
                   <Bar key={k} dataKey={k} fill={COLORS[idx % COLORS.length]} radius={[4,4,0,0]} barSize={barSize} />
                 ))}
               </BarChart>
             </ResponsiveContainer>
           ) : (
             // Pie chart: build pie data from totals (left/right) if available, else sum series across rows
             (() => {
               let pieData: any[] = [];
               if (leftTotal != null || rightTotal != null) {
                 if (leftTotal != null) pieData.push({ name: nameMap['left'] || 'Left', value: Number(leftTotal) });
                 if (rightTotal != null) pieData.push({ name: nameMap['right'] || 'Right', value: Number(rightTotal) });
               } else if (seriesKeys.length > 0 && chartData) {
                 pieData = seriesKeys.map((k) => ({ name: displayMetricName(k), value: chartData.reduce((s, p) => s + (Number(p[k]) || 0), 0) }));
               }
               if (!pieData || pieData.length === 0) return <div style={{ color: '#aaa' }}>No hay datos para mostrar.</div>;
               const COLORS = ['#1677ff', '#22c55e', '#f59e0b', '#ef4444'];
               return (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Tooltip formatter={(v: any) => (v == null ? '-' : Number(v).toLocaleString())} />
                     <Legend verticalAlign="top" align="right" wrapperStyle={{ color: '#bbb', fontSize: 12 }} />
                     {/* No paddingAngle and no stroke so slices are contiguous (no separators) */}
                     <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} paddingAngle={0} labelLine={false} label={false} stroke="none" >
                       {pieData.map((_, idx) => (
                         <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="none" />
                       ))}
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
               );
             })()
           )
         ) : leftTotal != null || rightTotal != null ? (
           <div style={{ display: 'flex', gap: 12 }}>
             {leftTotal != null && (
               <div style={{ background: 'rgba(0,0,0,0.06)', padding: 12, borderRadius: 8, minWidth: 110 }}>
                 <div style={{ fontSize: 12, color: '#ccc' }}>{nameMap['left'] || 'left'}</div>
                 <div style={{ fontWeight: 700, fontSize: 18 }}>{Number(leftTotal).toLocaleString()}</div>
               </div>
             )}
             {rightTotal != null && (
               <div style={{ background: 'rgba(0,0,0,0.06)', padding: 12, borderRadius: 8, minWidth: 110 }}>
                 <div style={{ fontSize: 12, color: '#ccc' }}>{nameMap['right'] || 'right'}</div>
                 <div style={{ fontWeight: 700, fontSize: 18 }}>{Number(rightTotal).toLocaleString()}</div>
               </div>
             )}
           </div>
         ) : (
           <div style={{ color: '#aaa' }}>No hay datos para mostrar.</div>
         )}
       </div>
     </div>
   );
 }

 export default CardsContainer;
