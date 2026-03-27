import apiClient from './apiClient';

export async function listUsers(params?: Record<string, any>) {
  return apiClient.get('/users', { params });
}

export async function createUser(data: Record<string, any>) {
  return apiClient.post('/users.json', { user: data });
}

export async function updateUser(id: number | string, data: Record<string, any>) {
  return apiClient.put(`/users/${id}.json`, { user: data });
}

export async function deleteUser(id: number | string) {
  return apiClient.delete(`/users/${id}`);
}
