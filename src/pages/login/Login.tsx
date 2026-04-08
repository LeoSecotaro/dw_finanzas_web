import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { getCurrentUser } from '../../api/usersApi';
import { API_CONFIG } from '../../config/api';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatError = (err: any) => {
    try {
      if (!err) return 'Error desconocido';
      const resp = err?.response?.data ?? err;

      // traducciones rápidas para mensajes comunes en inglés
      const translations: Record<string, string> = {
        'Invalid email or password.': 'E-mail o contraseña inválidos.',
        'Invalid Email or password.': 'E-mail o contraseña inválidos.',
        'Unauthorized': 'No autorizado',
        'Not Found': 'No encontrado',
        'Internal Server Error': 'Error interno del servidor'
      };

      if (typeof resp === 'string') {
        // exact match
        if (translations[resp]) return translations[resp];
        // contains
        for (const k of Object.keys(translations)) {
          if (String(resp).toLowerCase().includes(k.toLowerCase())) return translations[k];
        }
        return resp;
      }
      if (typeof resp === 'object' && resp !== null) {
        const msgCandidate = resp.error || resp.message || resp.detail;
        if (typeof msgCandidate === 'string') {
          if (translations[msgCandidate]) return translations[msgCandidate];
          for (const k of Object.keys(translations)) {
            if (msgCandidate.toLowerCase().includes(k.toLowerCase())) return translations[k];
          }
          return String(msgCandidate);
        }
        if (resp.errors) {
          if (Array.isArray(resp.errors)) return resp.errors.map((e:any) => (typeof e === 'string' ? (translations[e] || e) : JSON.stringify(e))).join('; ');
          if (typeof resp.errors === 'object') return Object.values(resp.errors).flat().map((e:any) => (typeof e === 'string' ? (translations[e] || e) : JSON.stringify(e))).join('; ');
        }
        try { return JSON.stringify(resp); } catch (e) { return String(resp); }
      }
      return String(err.message || err);
    } catch (e) {
      return 'Error inesperado';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hacer POST al endpoint Devise (formato JSON)
      const resp = await apiClient.post(API_CONFIG.ENDPOINTS.USER_SIGN_IN + '.json', {
        user: { email, password }
      });

      // Mostrar toast de éxito en español y sin mostrar payload
      toast.success('Inicio de sesión correcto', { autoClose: 1500 });

      // Redirect to home after successful login using react-router
      if (resp.status >= 200 && resp.status < 300) {
        // poll current user a few times so the client-side role guard in App can detect admin
        let ok = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            await getCurrentUser();
            ok = true;
            break;
          } catch (e) {
            // wait a bit before retrying (exponential backoff)
            await new Promise((r) => setTimeout(r, 150 * Math.pow(2, attempt)));
          }
        }
        if (!ok) {
          console.warn('Could not confirm current user after sign-in; proceeding to /home (guard may block if role unresolved)');
        }
        navigate('/home');
      }
    } catch (err: any) {
      const msg = formatError(err);
      // mostrar error con toast en español
      toast.error(msg, { autoClose: 1500 });
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
