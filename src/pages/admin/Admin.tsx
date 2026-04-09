import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();

  // fixed sidebar order (always shown)
  const sections = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'obras_sociales', label: 'Obras sociales' },
    { id: 'roles/permissions', label: 'Permisos' },
    { id: 'consultorios', label: 'Consultorios' },
    { id: 'roles', label: 'Roles' },
  ];

  const [active, setActive] = React.useState('inicio');

  // keep active tab in sync with URL and only redirect when user is at /admin
  React.useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const seg = parts[1] || 'inicio';
    setActive(seg);
    if (location.pathname === '/admin') {
      navigate('/admin/inicio', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div style={{ padding: 18 }}>
      <Navbar title="Administrador" />

      <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
        <AdminSidebar sections={sections} active={active} onSelect={(id) => { setActive(id); navigate(`/admin/${id}`); }} />

        <div style={{ flex: 1 }}>
          {/* Render child route content (e.g. /admin/horarios -> HorariosAdmin) */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}
