import type { CreatePaymentResponse, PaymentStatusResponse } from '@/types/payment';
import { apiFetch } from './api';

export const createPayment = (searchId: string, offerId: string) =>
  apiFetch<CreatePaymentResponse>('/api/payments', { method: 'POST', body: JSON.stringify({ searchId, offerId }) });

export const getPaymentStatus = (paymentIntentId: string) =>
  apiFetch<PaymentStatusResponse>(`/api/payments/${paymentIntentId}`);
