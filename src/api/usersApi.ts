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

// New: use Rails route `post "user/assign_user_role", to: "users#assign"`
export async function assignUserRole(userId: number | string, roleId: number | null, replace = true) {
  // Backend may expect role_id or user_role_id — send both to be compatible
  const payload: any = { user_id: userId, role_id: roleId, user_role_id: roleId, replace };
  // Log full URL and payload to help debug DevTools / Network issues
  try {
    console.debug('assignUserRole POST', apiClient.defaults.baseURL + '/user/assign_user_role', payload);
  } catch (e) {
    // ignore if apiClient lacks defaults
  }
  // Single dedicated route (ensure underscores, no spaces)
  return apiClient.post('/user/assign_user_role', payload);
}
