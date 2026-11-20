import type { PaymentApi } from './backend/types';
import { backend } from './backend/client';
import type { PaymentTarget } from '@/types/payment';

/**
 * Pagamentos pelo backend Raiji: ele cria a cobrança no Stripe com o valor do pedido e só
 * marca como pago depois de conferir no Stripe. O app nunca informa valor nem "paguei".
 */
const paymentPath = (target: PaymentTarget) =>
  target.kind === 'ride'
    ? `/api/rides/${target.rideId}/requests/${target.requestId}/payment`
    : `/api/deliveries/${target.deliveryId}/payment`;

/** Inicia (ou retoma) o pagamento: devolve o clientSecret para o formulário do Stripe */
export const startPayment = (target: PaymentTarget) => backend<PaymentApi>(paymentPath(target), { method: 'POST' });

/** Situação do pagamento (conferida no Stripe pelo backend) */
export const getPayment = (target: PaymentTarget) => backend<PaymentApi>(paymentPath(target));
