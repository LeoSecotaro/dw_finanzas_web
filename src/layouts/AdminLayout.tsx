import React from 'react';
import Navbar from '../components/navbar/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sections = [
    { id: 'dashboard', label: 'Inicio' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'consultorios', label: 'Consultorios' },
    { id: 'roles', label: 'Roles' },
    { id: 'obras_sociales', label: 'Obras Sociales' },
  ];

  // This layout does not manage active state; pages using it can render content centered
  return (
    <div>
      <Navbar title="Administrador" />
      <div style={{ display: 'flex', marginTop: 18 }}>
        <AdminSidebar sections={sections} active={''} onSelect={() => {}} />
        <main style={{ flex: 1, padding: 18, paddingLeft: 260, boxSizing: 'border-box', overflowX: 'auto', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
