import 'server-only';
import type { PaymentKind } from '@/types/payment';
import { findDeliveryOffer, markDeliveryPaid } from './deliveries';
import { findOffer } from './rideSearches';

/** Busca no servidor a oferta escolhida (é dela que vem o valor cobrado) */
export function findPayableOffer(kind: PaymentKind, referenceId: string, offerId: string) {
  return kind === 'delivery' ? findDeliveryOffer(referenceId, offerId) : findOffer(referenceId, offerId);
}

/**
 * "Pagamento concluído": efeitos de um pagamento aprovado.
 * Encomendas → "Gerar palavra-chave da entrega". Idempotente.
 */
export function handlePaymentSucceeded(metadata: Record<string, string>) {
  if (metadata.kind === 'delivery' && metadata.referenceId) {
    return { keyword: markDeliveryPaid(metadata.referenceId) ?? undefined };
  }
  // TODO (viagens): salvar a passagem no banco e avisar o motorista
  return {};
}
