import React from 'react';
import { translateColumn, humanizeKey } from '../../utils/columnTranslations';

export default function DataTable<T>({ columns, data, renderCell, minWidth = 1000 }: { columns: { key: string; label: string }[]; data: T[]; renderCell?: (row: T, key: string) => React.ReactNode; minWidth?: number }) {
  const [hoveredRow, setHoveredRow] = React.useState<number | null>(null);

  const renderValue = (row: any, key: string) => {
    // direct value
    let val = row?.[key];

    // if direct value is missing, try to find a similar key (case-insensitive / partial)
    if ((val === undefined || val === null) && row && typeof row === 'object') {
      const lowerKey = key.toLowerCase();
      const similar = Object.keys(row).find(k => k.toLowerCase() === lowerKey || k.toLowerCase().includes(lowerKey) || lowerKey.includes(k.toLowerCase()));
      if (similar) val = row[similar];
    }

    if (val === undefined || val === null) return '-';

    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);

    // if it's an object/array, try common properties
    if (typeof val === 'object') {
      if ('name' in val) return String((val as any).name);
      if ('nombre' in val) return String((val as any).nombre);
      if ('id' in val && Object.keys(val).length === 1) return String((val as any).id);
      try {
        return JSON.stringify(val);
      } catch (e) {
        return '-';
      }
    }

    return String(val);
  };

  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, color: '#000' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: minWidth, color: '#000' }}>
        <thead>
          <tr>
            {columns.map(c => {
              const translated = translateColumn(c.key) || c.label || humanizeKey(c.key);
              return <th key={c.key} style={{ textAlign: 'left', padding: 12, background: '#bbdefb', color: '#000' }}>{translated}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isHovered = hoveredRow === i;
            return (
              <tr
                key={(row as any).id || i}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderBottom: '1px solid #eee',
                  background: '#fff',
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                  boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.12)' : 'none',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                }}
              >
                {columns.map(c => {
                  const custom = renderCell ? renderCell(row, c.key) : undefined;
                  const cellContent = custom !== undefined && custom !== null ? custom : renderValue(row, c.key);
                  return (
                    <td key={c.key} style={{ padding: 10, color: '#000' }}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
