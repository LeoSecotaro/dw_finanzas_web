import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import apiClient from '../../api/apiClient';
import { API_CONFIG } from '../../config/api';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

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
      // Redirect to home after successful login using react-router
      if (resp.status >= 200 && resp.status < 300) {
        navigate('/home');
      }
    } catch (err: any) {
      // Mostrar error recibido o mensaje genérico
      setResult(err.response?.data || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h1 className={styles.heading}>Ingresá tu e-mail para iniciar sesión</h1>
      </div>

      <div className={styles.cardContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>E-mail</label>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
          />

          <label className={styles.label}>Contraseña</label>
          <div className={styles.passwordWrapper}>
            <input
              className={styles.input}
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
              className={styles.toggleButton}
            >
              {/* Icon reflects current state: eye when visible, eye-slash when hidden */}
              {showPassword ? (
                <FaEye size={18} />
              ) : (
                <FaEyeSlash size={18} />
              )}
            </button>
          </div>

          {result && <div className={styles.result}>{String(result)}</div>}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Cargando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
