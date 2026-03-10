import React from 'react';

// very small calendar grid component: week view with hours
export default function CalendarGrid({ weekStart, horaries }: { weekStart: string; horaries: any[] }) {
  // weekStart YYYY-MM-DD string; for now we won't compute dates precisely
  const days = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  // start the visible day at 06:00 (omit 00:00 - 05:00)
  const startHour = 6;
  const hours = Array.from({ length: 24 - startHour }, (_, i) => `${(startHour + i).toString().padStart(2,'0')}:00`);

  // smaller slot to make the whole grid fit vertically in most viewports
  const slotHeight = 28;
  // const totalHeight = slotHeight * 24;

  return (
    <div style={{ background: '#2d2d2d', color: '#fff', borderRadius: 8, padding: 12, width: '100%', maxWidth: 1800, margin: '0 auto', boxSizing: 'border-box', paddingTop: 40 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {days.map((d) => <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>{d}</div>)}
      </div>
      {/* left label column wider and day columns have a sensible min width */}
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(7, minmax(180px, 1fr))`, gap: 12, gridAutoRows: `${slotHeight}px`, alignItems: 'start' }}>
        {hours.map((h) => (
          <React.Fragment key={h}>
            <div style={{ color: '#bbb', fontSize: 11, paddingTop: 6, height: slotHeight }}>{h}</div>
            {days.map((d) => (
              <div key={d+h} style={{ height: slotHeight - 4, background: '#3a3a3a', borderRadius: 6, margin: 6 }} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
