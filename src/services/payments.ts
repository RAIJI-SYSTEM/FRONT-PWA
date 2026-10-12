import type { CreatePaymentRequest, CreatePaymentResponse, PaymentStatusResponse } from '@/types/payment';
import { apiFetch } from './api';

export const createPayment = (request: CreatePaymentRequest) =>
  apiFetch<CreatePaymentResponse>('/api/payments', { method: 'POST', body: JSON.stringify(request) });

export const getPaymentStatus = (paymentIntentId: string) =>
  apiFetch<PaymentStatusResponse>(`/api/payments/${paymentIntentId}`);
