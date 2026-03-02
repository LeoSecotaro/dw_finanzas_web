import { useState } from 'react';
import apiClient from '../api/apiClient';
import { API_CONFIG } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Hacer POST al endpoint Devise (formato JSON)
      const resp = await apiClient.post(API_CONFIG.ENDPOINTS.USER_SIGN_IN + '.json', {
        user: { email, password }
      });

      setResult(JSON.stringify(resp.data));
    } catch (err: any) {
      // Mostrar error recibido o mensaje genérico
      setResult(err.response?.data || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', padding: 20 }}>
      <div style={{ flex: 1, padding: 20 }}>
        <h1 style={{ color: '#111' }}>Ingresá tu e-mail para iniciar sesión</h1>
      </div>

      <div style={{ width: 420, border: '1px solid #e6e6e6', borderRadius: 8, padding: 20, background: '#fff' }}>
        <form onSubmit={handleSubmit}>
          <label className="login-label">E-mail</label>
          <input
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
          />

          <label className="login-label">Contraseña</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              className="login-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: 'absolute',
                right: 8,
                top: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Eye / Eye-off SVG icons */}
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94C16.01 19.11 13.57 20 11 20 6 20 2 12 2 12s1.99-3.11 5.12-5.11" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.88 9.88A3 3 0 0114.12 14.12" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2l20 20" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.94 17.94C16.01 19.11 13.57 20 11 20 6 20 2 12 2 12c1.8-2.8 4.9-5.11 9-5.11" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {result && <div style={{ color: 'crimson', marginBottom: 8 }}>{String(result)}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1677ff',
              color: '#fff',
              padding: '10px',
              borderRadius: 6,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Cargando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
