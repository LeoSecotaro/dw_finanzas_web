import apiClient from './apiClient';

type Params = Record<string, any>;

export async function getCompare(params: Params) {
  return apiClient.get('/reports/compare', { params });
}

export async function getCompareMulti(params: Params) {
  return apiClient.get('/reports/compare_multi', { params });
}

export async function getCompareProduction(params: Params) {
  return apiClient.get('/reports/compare_production', { params });
}
