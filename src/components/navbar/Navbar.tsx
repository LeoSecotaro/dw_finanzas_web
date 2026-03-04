import React from 'react';
import styles from './Navbar.module.css';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = 'App' }: NavbarProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

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
      <div className={styles.title}>{title}</div>
      <div className={styles.actions}>
        <button className={styles.logoutButton} onClick={handleLogout} disabled={loading}>
          {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}
