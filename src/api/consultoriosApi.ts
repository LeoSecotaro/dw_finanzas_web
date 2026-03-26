import apiClient from './apiClient';

export async function listConsultorios(params?: Record<string, any>) {
  return apiClient.get('/consultorios', { params });
}

export async function updateConsultorio(id: number | string, data: Record<string, any>) {
  // Some Rails setups route update via PUT or expect .json suffix — use PUT with .json to be compatible
  return apiClient.put(`/consultorios/${id}.json`, { consultorio: data });
}

export async function deleteConsultorio(id: number | string) {
  return apiClient.delete(`/consultorios/${id}`);
}

export async function createConsultorio(data: Record<string, any>) {
  // Use POST with .json suffix for Rails compatibility
  return apiClient.post(`/consultorios.json`, { consultorio: data });
}
