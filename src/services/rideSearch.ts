import type { RideSearch, RideSearchRequest } from '@/types/ride';
import { apiFetch } from './api';

export const createRideSearch = (request: RideSearchRequest) =>
  apiFetch<RideSearch>('/api/searches', { method: 'POST', body: JSON.stringify(request) });

export const getRideSearch = (id: string) => apiFetch<RideSearch>(`/api/searches/${id}`);

export const cancelRideSearch = (id: string) => apiFetch<RideSearch>(`/api/searches/${id}`, { method: 'DELETE' });
