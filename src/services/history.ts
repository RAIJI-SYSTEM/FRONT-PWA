import type { DeliveryHistoryItem, HistoryKind, RateDriverRequest, RideHistoryItem } from '@/types/history';
import { apiFetch } from './api';

export const listRides = () => apiFetch<RideHistoryItem[]>('/api/history/rides');

export const listDeliveries = () => apiFetch<DeliveryHistoryItem[]>('/api/history/deliveries');

export const rateDriver = <T extends RideHistoryItem | DeliveryHistoryItem>(kind: HistoryKind, id: string, request: RateDriverRequest) =>
  apiFetch<T>(`/api/history/${kind}/${id}/rating`, { method: 'POST', body: JSON.stringify(request) });
