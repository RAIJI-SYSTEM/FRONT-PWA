import type { DriverProfile, DriverService, PersonType, PublicTrip } from '@/types/drivers';
import { apiFetch } from './api';

export const listDriversInCity = (city: string, filters: { personType?: PersonType; service?: DriverService } = {}) => {
  const params = new URLSearchParams({ cidade: city });
  if (filters.personType) params.set('tipo', filters.personType);
  if (filters.service) params.set('servico', filters.service);
  return apiFetch<DriverProfile[]>(`/api/drivers?${params}`);
};

export const findDriverByCode = (code: string) => apiFetch<DriverProfile>(`/api/drivers/code/${code}`);

export const searchTrips = (from: string, to: string, date?: string) => {
  const params = new URLSearchParams({ de: from, para: to });
  if (date) params.set('data', date);
  return apiFetch<PublicTrip[]>(`/api/trips?${params}`);
};
