import React from 'react';
import Navbar from '../../components/navbar/Navbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import DataTable from '../../components/admin/DataTable';
import { listConsultorios } from '../../api/consultoriosApi';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Admin() {
  const sections = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'consultorios', label: 'Consultorios' },
    { id: 'roles', label: 'Roles' },
  ];

  const [active, setActive] = React.useState('inicio');
  const navigate = useNavigate();
  const location = useLocation();

  // keep active tab in sync with URL and only redirect when user is at /admin
  React.useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    // parts like ['admin', 'inicio'] -> take second segment
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
          {active === 'inicio' && (
            <div>
              <h3>Panel de administración</h3>
              <p style={{ color: '#666' }}>Seleccione una sección en la barra lateral para gestionar datos.</p>
            </div>
          )}

          {active === 'usuarios' && (
            <div>
              <h3>Usuarios</h3>
              <p>Página para manejar usuarios con tabla dinámica (ejemplo).</p>
              <DataTable columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nombre' }, { key: 'email', label: 'Email' }]} data={[{ id: 1, name: 'Juan', email: 'juan@x' }, { id: 2, name: 'Ana', email: 'ana@x' }]} />
            </div>
          )}

          {active === 'horarios' && (
            <div>
              <h3>Horarios</h3>
              <p>Página para manejar horarios (por implementar).</p>
            </div>
          )}

          {active === 'consultorios' && (
            <div>
              <h3>Consultorios</h3>
              <p>Ahora esta sección abre la página dedicada. <button onClick={() => navigate('/admin/consultorios')} style={{ marginLeft: 8, padding: '6px 10px' }}>Ir a Consultorios</button></p>
            </div>
          )}

          {active === 'roles' && (
            <div>
              <h3>Roles</h3>
              <p>Página para manejar roles (por implementar).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
