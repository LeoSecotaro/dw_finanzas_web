import apiClient from './apiClient';

export async function listObrasSociales(params?: Record<string, any>) {
  return apiClient.get('/obra_socials', { params });
}

export async function createObraSocial(data: Record<string, any>) {
  return apiClient.post('/obra_socials.json', { obra_social: data });
}

export async function updateObraSocial(id: number | string, data: Record<string, any>) {
  return apiClient.put(`/obra_socials/${id}.json`, { obra_social: data });
}

export async function deleteObraSocial(id: number | string) {
  return apiClient.delete(`/obra_socials/${id}`);
}
