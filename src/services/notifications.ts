import type { AppMode } from '@/types/message';
import type { AppNotification, NotificationPreferences } from '@/types/notification';
import { apiFetch, apiUrl } from './api';

const q = (mode: AppMode) => (mode === 'driver' ? '?modo=motorista' : '');

export const listNotifications = (mode: AppMode) => apiFetch<AppNotification[]>(`/api/notifications${q(mode)}`);

/** Sem ids: marca todas do modo como lidas */
export const markNotificationsRead = (mode: AppMode, ids?: string[]) =>
  apiFetch<AppNotification[]>(`/api/notifications/read${q(mode)}`, { method: 'POST', body: JSON.stringify({ ids }) });

export const deleteNotification = async (mode: AppMode, id: string) => {
  const response = await fetch(apiUrl(`/api/notifications/${id}${q(mode)}`), { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error('Não foi possível apagar.');
};

export const getNotificationPreferences = (mode: AppMode) => apiFetch<NotificationPreferences>(`/api/notifications/preferences${q(mode)}`);

export const updateNotificationPreferences = (mode: AppMode, changes: Partial<NotificationPreferences>) =>
  apiFetch<NotificationPreferences>(`/api/notifications/preferences${q(mode)}`, { method: 'PATCH', body: JSON.stringify(changes) });
