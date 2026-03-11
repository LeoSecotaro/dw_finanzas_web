import apiClient from './apiClient';

export type DayItem = {
  id: number;
  name?: string;
  short_name?: string;
};

export async function listDays() {
  return apiClient.get('/days');
}

export async function getDay(id: number) {
  return apiClient.get(`/days/${id}`);
}
