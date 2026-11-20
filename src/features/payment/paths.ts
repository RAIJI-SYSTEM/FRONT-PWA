import type { PaymentTarget } from '@/types/payment';

const query = (target: PaymentTarget) =>
  target.kind === 'ride'
    ? `carona=${encodeURIComponent(target.rideId)}&reserva=${encodeURIComponent(target.requestId)}`
    : `id=${encodeURIComponent(target.deliveryId)}`;

/** Rotas de pagamento de cada fluxo (carona e encomenda reutilizam as mesmas telas) */
export const paymentPaths = {
  checkout: (target: PaymentTarget) => `${target.kind === 'ride' ? '/viagem' : '/encomenda'}/pagamento?${query(target)}`,
  status: (target: PaymentTarget) => `${target.kind === 'ride' ? '/viagem' : '/encomenda'}/pagamento/status?${query(target)}`,
};

/** Lê o alvo do pagamento da URL das páginas de pagamento */
export function paymentTargetFrom(kind: PaymentTarget['kind'], params: URLSearchParams): PaymentTarget | null {
  if (kind === 'ride') {
    const rideId = params.get('carona');
    const requestId = params.get('reserva');
    return rideId && requestId ? { kind, rideId, requestId } : null;
  }
  const deliveryId = params.get('id');
  return deliveryId ? { kind, deliveryId } : null;
}
