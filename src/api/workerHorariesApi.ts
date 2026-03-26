import apiClient from './apiClient';

export type HoraryParams = {
  date?: string; // YYYY-MM-DD
  day_id?: number;
  consultorio_id?: number;
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  note?: string;
  title?: string;
};

export async function listWorkerHoraries(params?: Record<string, any>) {
  return apiClient.get('/worker_horaries', { params });
}

export async function getWorkerHorary(id: number | string) {
  return apiClient.get(`/worker_horaries/${id}`);
}

export async function createWorkerHorary(data: HoraryParams) {
  return apiClient.post('/worker_horaries', { worker_horary: data });
}

export async function updateWorkerHorary(id: number | string, data: HoraryParams) {
  return apiClient.patch(`/worker_horaries/${id}`, { worker_horary: data });
}

export async function deleteWorkerHorary(id: number | string) {
  return apiClient.delete(`/worker_horaries/${id}`);
}

// replacements (nested resource)
export async function listReplacements(horaryId: number | string) {
  return apiClient.get(`/worker_horaries/${horaryId}/replacements`);
}

export async function createReplacement(horaryId: number | string, data: Record<string, any>) {
  // backend often expects wrapper { replacement: {...} }
  return apiClient.post(`/worker_horaries/${horaryId}/replacements`, { replacement: data });
}

export async function updateReplacement(horaryId: number | string, replacementId: number | string, data: Record<string, any>) {
  return apiClient.patch(`/worker_horaries/${horaryId}/replacements/${replacementId}`, { replacement: data });
}

export async function deleteReplacement(horaryId: number | string, replacementId: number | string) {
  return apiClient.delete(`/worker_horaries/${horaryId}/replacements/${replacementId}`);
}

// faltas (nested resource)
export async function listFaltas(horaryId: number | string) {
  return apiClient.get(`/worker_horaries/${horaryId}/faltas`);
}

export async function createFalta(horaryId: number | string, data: Record<string, any>) {
  return apiClient.post(`/worker_horaries/${horaryId}/faltas`, { falta: data });
}

export async function updateFalta(horaryId: number | string, faltaId: number | string, data: Record<string, any>) {
  return apiClient.patch(`/worker_horaries/${horaryId}/faltas/${faltaId}`, { falta: data });
}

export async function deleteFalta(horaryId: number | string, faltaId: number | string) {
  return apiClient.delete(`/worker_horaries/${horaryId}/faltas/${faltaId}`);
}
