import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Configurar axios para incluir cookies automáticamente
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true, // Incluir cookies en las peticiones
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export type SignInData = { user: { email: string; password: string } };

export default apiClient;
