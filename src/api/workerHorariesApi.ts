import apiClient from './apiClient';

export type HoraryParams = {
  date?: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  note?: string;
};

export async function listWorkerHoraries(params?: Record<string, any>) {
  return apiClient.get('/worker_horaries', { params });
}

export async function getWorkerHorary(id: number) {
  return apiClient.get(`/worker_horaries/${id}`);
}

export async function createWorkerHorary(data: HoraryParams) {
  return apiClient.post('/worker_horaries', { worker_horary: data });
}

export async function updateWorkerHorary(id: number, data: HoraryParams) {
  return apiClient.patch(`/worker_horaries/${id}`, { worker_horary: data });
}

export async function deleteWorkerHorary(id: number) {
  return apiClient.delete(`/worker_horaries/${id}`);
}

// replacements (nested resource)
export async function createReplacement(horaryId: number, data: any) {
  return apiClient.post(`/worker_horaries/${horaryId}/replacements`, { replacement: data });
}

export async function updateReplacement(horaryId: number, replacementId: number, data: any) {
  return apiClient.patch(`/worker_horaries/${horaryId}/replacements/${replacementId}`, { replacement: data });
}

export async function deleteReplacement(horaryId: number, replacementId: number) {
  return apiClient.delete(`/worker_horaries/${horaryId}/replacements/${replacementId}`);
}
