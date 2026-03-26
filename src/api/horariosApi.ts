import apiClient from './apiClient';

export async function listHorarios(params?: Record<string, any>) {
  return apiClient.get('/horarios', { params });
}

export async function createHorario(data: Record<string, any>) {
  return apiClient.post('/horarios.json', { horario: data });
}

export async function updateHorario(id: number | string, data: Record<string, any>) {
  return apiClient.put(`/horarios/${id}.json`, { horario: data });
}

export async function deleteHorario(id: number | string) {
  return apiClient.delete(`/horarios/${id}`);
}
