import type { PaymentKind } from '@/types/payment';

/** Rotas de pagamento de cada fluxo (viagem e encomenda reutilizam as mesmas telas) */
export const paymentPaths: Record<
  PaymentKind,
  { checkout: (referenceId: string, offerId: string) => string; status: (referenceId: string, offerId: string) => string }
> = {
  ride: {
    checkout: (id, offer) => `/viagem/pagamento?busca=${id}&oferta=${offer}`,
    status: (id, offer) => `/viagem/pagamento/status?busca=${id}&oferta=${offer}`,
  },
  delivery: {
    checkout: (id, offer) => `/encomenda/pagamento?id=${id}&oferta=${offer}`,
    status: (id, offer) => `/encomenda/pagamento/status?id=${id}&oferta=${offer}`,
  },
};
