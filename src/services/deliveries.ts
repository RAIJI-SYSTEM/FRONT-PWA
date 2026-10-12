import type { Delivery, DeliveryDetailsRequest } from '@/types/delivery';
import type { Place } from '@/types/place';
import { apiFetch } from './api';

export const createDelivery = (origin: Place, destination: Place) =>
  apiFetch<Delivery>('/api/deliveries', { method: 'POST', body: JSON.stringify({ origin, destination }) });

export const getDelivery = (id: string) => apiFetch<Delivery>(`/api/deliveries/${id}`);

export const submitDeliveryDetails = (id: string, request: DeliveryDetailsRequest) =>
  apiFetch<Delivery>(`/api/deliveries/${id}/details`, { method: 'PUT', body: JSON.stringify(request) });

export const cancelDelivery = (id: string) => apiFetch<Delivery>(`/api/deliveries/${id}`, { method: 'DELETE' });
