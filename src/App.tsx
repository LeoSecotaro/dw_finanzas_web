import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login/Login'
import Home from './pages/Home'
import Finance from './pages/Finance'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/finance" element={<Finance />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
