import React from 'react';
import styles from './Navbar.module.css';
import apiClient from '../../api/apiClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = 'App' }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = React.useState(false);

  const showBack = location.pathname !== '/home';

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiClient.delete('/users/sign_out.json');
      // redirect to login
      navigate('/login');
    } catch (err) {
      console.error('logout failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.navbar}>
      {showBack && (
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Volver">
          <FaArrowLeft size={18} />
        </button>
      )}
      <div className={styles.title}>{title}</div>
      <div className={styles.actions}>
        <button className={styles.logoutButton} onClick={handleLogout} disabled={loading}>
          {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}
