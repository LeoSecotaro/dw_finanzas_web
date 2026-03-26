import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar({ sections, active, onSelect }: { sections: { id: string; label: string }[]; active: string; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (id: string) => {
    // If using routing, navigate to dedicated admin pages
    if (id === 'consultorios') {
      navigate('/admin/consultorios');
      return;
    }
    if (id === 'roles') {
      navigate('/admin/roles');
      return;
    }
    if (id === 'horarios') {
      navigate('/admin/horarios');
      return;
    }
    // keep in Admin page
    onSelect(id);
  };

  return (
    // Sidebar fixed to the left, full height below the top navbar (assumes navbar height is 64px)
    <aside style={{ position: 'fixed', top: 64, left: 0, bottom: 0, width: 260, background: '#2f2f2f', padding: 20, boxSizing: 'border-box', color: '#fff', zIndex: 30 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Gestionar sistema</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((s) => {
          const isHovered = hovered === s.id;
          // mark active if route matches /admin/:section or sidebar active state
          const isActive = location.pathname === `/admin/${s.id}` || active === s.id;

          return (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                background: isHovered ? '#3a3a3a' : isActive ? '#4a4a4a' : 'transparent',
                color: '#fff',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.4)' : 'none',
                transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                outline: 'none',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
