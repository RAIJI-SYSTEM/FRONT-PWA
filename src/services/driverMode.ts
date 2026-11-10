import type { Cnh, DriverAccount, DriverJob, DriverRoute, NewDriverRoute, RegionRequest, Vehicle } from '@/types/driverMode';
import type { RateDriverRequest } from '@/types/history';
import { apiFetch } from './api';

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const getDriverAccount = () => apiFetch<DriverAccount>('/api/driver/account');
export const saveCnh = (cnh: Partial<Cnh> & { frontPhotoId?: string; backPhotoId?: string }) =>
  apiFetch<DriverAccount>('/api/driver/cnh', json('PUT', cnh));

export const addVehicle = (vehicle: Partial<Vehicle>) => apiFetch<DriverAccount>('/api/driver/vehicles', json('POST', vehicle));
export const updateVehicle = (id: string, changes: Partial<Vehicle>) => apiFetch<DriverAccount>(`/api/driver/vehicles/${id}`, json('PATCH', changes));
export const removeVehicle = (id: string) => apiFetch<DriverAccount>(`/api/driver/vehicles/${id}`, json('DELETE'));

export const listDriverRoutes = () => apiFetch<DriverRoute[]>('/api/driver/routes');
export const publishRoute = (route: Partial<NewDriverRoute>) => apiFetch<DriverRoute>('/api/driver/routes', json('POST', route));
export const cancelRoute = (id: string) => apiFetch<DriverRoute>(`/api/driver/routes/${id}`, json('DELETE'));

export const listRegionRequests = () => apiFetch<RegionRequest[]>('/api/driver/requests');
export const respondToRequest = (id: string, action: 'accept' | 'reject') =>
  apiFetch<{ request: RegionRequest }>(`/api/driver/requests/${id}`, json('POST', { action }));

export const listDriverJobs = () => apiFetch<DriverJob[]>('/api/driver/jobs');
export const rateCustomer = (id: string, rating: RateDriverRequest) => apiFetch<DriverJob>(`/api/driver/jobs/${id}/rating`, json('POST', rating));
