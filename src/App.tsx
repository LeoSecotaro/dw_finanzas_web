import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import Home from './pages/Home'
import Finance from './pages/finance/Finance'
import Schedules from './pages/schedules/Schedules'
import Admin from './pages/admin/Admin'
import ConsultoriosAdminPage from './pages/admin/ConsultoriosAdminPage'
import RolesAdmin from './pages/admin/RolesAdmin'
import HorariosAdmin from './pages/admin/HorariosAdmin'
import WorkerHoraryDetail from './pages/admin/WorkerHoraryDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/horarios" element={<Schedules />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/consultorios" element={<ConsultoriosAdminPage />} />
        <Route path="/admin/roles" element={<RolesAdmin />} />
        <Route path="/admin/horarios" element={<HorariosAdmin />} />
        <Route path="/admin/horarios/:id" element={<WorkerHoraryDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
