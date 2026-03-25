import React from 'react';

export default function DataTable<T>({ columns, data, renderCell }: { columns: { key: string; label: string }[]; data: T[]; renderCell?: (row: T, key: string) => React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, color: '#000' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, color: '#000' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ textAlign: 'left', padding: 12, background: '#ffd54f', color: '#000' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={(row as any).id || i} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: 10, color: '#000' }}>
                  {renderCell ? renderCell(row, c.key) : ((row as any)[c.key] as any)?.toString?.()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
