import type { FreightApi, OfferStatus } from '@/services/backend/types';

export const FREIGHT_STATUS: Record<FreightApi['status'], { label: string; color: 'default' | 'primary' | 'success' | 'error' }> = {
  OPEN: { label: 'Em aberto', color: 'primary' },
  ACCEPTED: { label: 'Fechado', color: 'success' },
  DECLINED: { label: 'Recusado', color: 'error' },
  CANCELLED: { label: 'Cancelado', color: 'default' },
};

export const OFFER_STATUS: Record<OfferStatus, string> = {
  PENDING: 'Aguardando',
  ACCEPTED: 'Escolhida',
  DECLINED: 'Não escolhida',
  WITHDRAWN: 'Retirada',
};
