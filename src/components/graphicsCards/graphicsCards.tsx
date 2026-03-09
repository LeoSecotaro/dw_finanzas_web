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

function numberOrNull(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

  // Build chart data from rows if available
  let chartData: Array<any> | null = null;
  let seriesKeys: string[] = [];

  if (rows && rows.length > 0) {
    const first = rows[0];
    // pick up numeric keys for series (exclude key/date and any diff/pct-like fields returned by backend)
    // exclude any key that contains 'diff' or 'pct' (case-insensitive) so those fields are never rendered in charts
    const numericKeys = Object.keys(first).filter((k) => k !== 'key' && k !== 'label' && k !== 'date' && !/diff|pct/i.test(k) && numberOrNull(first[k]) !== null);
    // keep all numeric keys (support multi-compare)
    seriesKeys = numericKeys.length ? numericKeys : [];
    // if no numeric typed fields, attempt coercion (keep all)
    if (seriesKeys.length === 0) {
      const coerced = Object.keys(first)
        .filter((k) => k !== 'key' && k !== 'label' && k !== 'date' && !/diff|pct/i.test(k))
        .filter((k) => numberOrNull(first[k]) !== null);
      seriesKeys = coerced;
    }

    chartData = rows.map((r: any) => {
      const point: any = { name: r.key ?? r.label ?? r.date };
      seriesKeys.forEach((k) => {
        point[k] = numberOrNull(r[k]);
      });
      return point;
    });
  }

  // (We don't show numeric diffs inside the charts) Read totals_diffs for per-metric percentages
  const totalsDiffs: Record<string, any> = data?.totals_diffs ?? data?.totals_diffs_by_source ?? {};
  // Fallback percent from totals for simple left/right comparisons
  const pctFromTotals = totals?.pct_diff ?? totals?.pct_from_base ?? null;

  // Get readable totals for left/right if provided
  const leftTotal = totals?.left ?? null;
  const rightTotal = totals?.right ?? null;

  // Build a nameMap from backend params so we can show friendly names (e.g. 'Producción') for keys like 'left'/'right' or sources
  const params = data?.params ?? {};
  const nameMap: Record<string, string> = {};
  if (params.left) nameMap['left'] = displayMetricName(params.left);
  if (params.right) nameMap['right'] = displayMetricName(params.right);
  if (params.sources && typeof params.sources === 'string') {
    params.sources.split(',').forEach((s: string) => { const key = s.trim(); if (key) nameMap[key] = displayMetricName(key); });
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
      {Object.keys(totalsDiffs || {}).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', maxWidth: '100%', overflow: 'hidden' }}>
          {Object.keys(totalsDiffs).map((k) => {
            const { diff, pct_from_base } = totalsDiffs[k] || {};
            const pct = pct_from_base != null ? pct_from_base : (diff != null ? (diff / Math.abs(diff)) * 100 : null);
            const isPositive = pct != null && pct > 0;
            const isNegative = pct != null && pct < 0;
            return (
              <div key={k} style={{ background: isPositive ? 'rgba(22, 119, 255, 0.06)' : isNegative ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
                <div style={{ color: isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#ddd', fontWeight: 600 }}>{pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '-'}</div>
                <div style={{ color: '#bbb', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayMetricName(k)}</div>
              </div>
            );
          })}
        </div>
      )}
      {/* Fallback: if no per-metric totalsDiffs but totals contain pct_diff (two-series case), show it as a single pill */}
      {Object.keys(totalsDiffs || {}).length === 0 && pctFromTotals != null && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ background: pctFromTotals > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', padding: '6px 12px', borderRadius: 999, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: pctFromTotals > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{Number(pctFromTotals).toFixed(1)}%</div>
            <div style={{ color: '#bbb', fontSize: 12 }}>{displayMetricName(params?.right ?? params?.left ?? 'Variación')}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {chartData && seriesKeys.length > 0 ? (
          chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 6 }} barCategoryGap="18%" barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" tick={{ fill: '#bbb', fontSize: 12 }} />
                <YAxis tick={{ fill: '#bbb', fontSize: 12 }} />
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
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={60} paddingAngle={4} labelLine={false} label={false}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
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
