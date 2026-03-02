import { API_ENDPOINTS } from './endpoints';

const BASE_URL = import.meta.env.PROD 
  ? 'https://homefixingbackend-production.up.railway.app'  
  : 'http://localhost:3000';

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: API_ENDPOINTS
};

export default API_CONFIG;
