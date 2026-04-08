import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import Home from './pages/Home'
import Finance from './pages/finance/Finance'
import Schedules from './pages/schedules/Schedules'
import Admin from './pages/admin/Admin'
import AdminGuard from './components/auth/AdminGuard';
import ConsultoriosAdminPage from './pages/admin/ConsultoriosAdminPage'
import RolesAdmin from './pages/admin/RolesAdmin'
import HorariosAdmin from './pages/admin/HorariosAdmin'
import WorkerHoraryDetail from './pages/admin/WorkerHoraryDetail'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'
import ObrasSocialesAdmin from './pages/admin/ObrasSocialesAdmin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/horarios" element={<Schedules />} />

        {/* Admin parent route: use nested routes so Admin's <Outlet/> renders the specific admin pages */}
        <Route path="/admin/*" element={
          <AdminGuard>
            <Admin />
          </AdminGuard>
        }>
          <Route index element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="usuarios" element={<UsuariosAdmin />} />
          <Route path="horarios" element={<HorariosAdmin />} />
          <Route path="obras_sociales" element={<ObrasSocialesAdmin />} />
          <Route path="consultorios" element={<ConsultoriosAdminPage />} />
          <Route path="roles" element={<RolesAdmin />} />
          {/* Example of nested detail route used elsewhere */}
          <Route path="horarios/:workerId" element={<WorkerHoraryDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
