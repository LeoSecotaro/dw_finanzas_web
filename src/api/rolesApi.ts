import apiClient from './apiClient';

export async function listRoles(params?: Record<string, any>) {
  return apiClient.get('/roles', { params });
}

export async function createRole(data: Record<string, any>) {
  return apiClient.post('/roles.json', { role: data });
}

export async function updateRole(id: number | string, data: Record<string, any>) {
  return apiClient.put(`/roles/${id}.json`, { role: data });
}

export async function deleteRole(id: number | string) {
  return apiClient.delete(`/roles/${id}`);
}
