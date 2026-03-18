import apiClient from './apiClient';

export async function listConsultorios(params?: Record<string, any>) {
  return apiClient.get('/consultorios', { params });
}
