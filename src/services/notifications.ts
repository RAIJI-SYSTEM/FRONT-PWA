import type { AppMode } from '@/types/message';
import type { AppNotification, NotificationCategory, NotificationPreferences } from '@/types/notification';
import { apiFetch } from './api';
import { backend } from './backend/client';
import type { NotificationApi, NotificationAudience } from './backend/types';

const q = (mode: AppMode) => (mode === 'driver' ? '?modo=motorista' : '');

/** Avisos do backend: no modo passageiro entram também os da empresa; no motorista, os de motorista */
const audiencesOf = (mode: AppMode): NotificationAudience[] => (mode === 'driver' ? ['DRIVER'] : ['PASSENGER', 'COMPANY']);

const TITLES: Record<string, string> = {
  RIDE_REQUEST: 'Novo pedido de vaga',
  RIDE_REQUEST_ACCEPTED: 'Vaga confirmada',
  RIDE_REQUEST_REJECTED: 'Pedido de vaga recusado',
  RIDE_BOOKING_CANCELLED: 'Reserva cancelada',
  RIDE_CANCELLED: 'Viagem cancelada',
  BAGGAGE_CHANGE_REQUEST: 'Pedido de mais bagagem',
  BAGGAGE_CHANGE_APPROVED: 'Bagagem aprovada',
  BAGGAGE_CHANGE_REJECTED: 'Bagagem não aprovada',
  DELIVERY_REQUEST: 'Novo pedido de encomenda',
  DELIVERY_ACCEPTED: 'Encomenda aceita',
  DELIVERY_REJECTED: 'Encomenda recusada',
  DELIVERY_PICKED_UP: 'Encomenda coletada',
  DELIVERY_DELIVERED: 'Encomenda entregue',
  DELIVERY_CANCELLED: 'Encomenda cancelada',
  FREIGHT_PROPOSAL: 'Proposta de frete',
  FREIGHT_ACCEPTED: 'Frete aceito',
  FREIGHT_DECLINED: 'Frete recusado',
  FREIGHT_CANCELLED: 'Frete cancelado',
  FREIGHT_OFFER: 'Nova oferta de frete',
  FREIGHT_OFFER_ACCEPTED: 'Sua oferta foi escolhida',
  FREIGHT_OFFER_DECLINED: 'Oferta não escolhida',
};

function toAppNotification(n: NotificationApi, mode: AppMode): AppNotification {
  const kind = n.kind ?? '';
  const category: NotificationCategory = kind.startsWith('DELIVERY') || kind.startsWith('FREIGHT') ? 'deliveries' : 'trips';
  let href: string | undefined;
  if (kind.startsWith('FREIGHT')) {
    href = n.audience === 'COMPANY' && n.referenceId ? `/empresa/frete?id=${n.referenceId}` : mode === 'driver' ? '/motorista/fretes' : undefined;
    if (kind === 'FREIGHT_OFFER_ACCEPTED' || kind === 'FREIGHT_ACCEPTED') href = mode === 'driver' ? '/motorista/rotas' : href;
  } else if (mode === 'driver') {
    href = n.rideId ? `/motorista/rotas/gerenciar?id=${n.rideId}` : '/motorista/rotas';
  } else {
    href = kind.startsWith('DELIVERY') ? '/encomendas' : '/corridas';
  }
  return {
    id: n.id,
    mode,
    category,
    title: TITLES[kind] ?? 'Aviso',
    body: n.message,
    createdAt: n.createdAt,
    read: n.read,
    href,
  };
}

export async function listNotifications(mode: AppMode): Promise<AppNotification[]> {
  const lists = await Promise.all(
    audiencesOf(mode).map((audience) => backend<NotificationApi[]>('/api/notifications', { query: { audience } })),
  );
  return lists
    .flat()
    .map((n) => toAppNotification(n, mode))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Sem ids: marca todas do modo como lidas */
export async function markNotificationsRead(mode: AppMode, ids?: string[]) {
  await Promise.all(
    audiencesOf(mode).map((audience) => backend('/api/notifications/read', { method: 'POST', body: { audience, ids: ids ?? [] } })),
  );
  return listNotifications(mode);
}

/** O backend não apaga avisos: some da lista ao marcar como lido */
export const deleteNotification = async (mode: AppMode, id: string) => {
  await markNotificationsRead(mode, [id]);
};

export const getNotificationPreferences = (mode: AppMode) => apiFetch<NotificationPreferences>(`/api/notifications/preferences${q(mode)}`);

export const updateNotificationPreferences = (mode: AppMode, changes: Partial<NotificationPreferences>) =>
  apiFetch<NotificationPreferences>(`/api/notifications/preferences${q(mode)}`, { method: 'PATCH', body: JSON.stringify(changes) });
