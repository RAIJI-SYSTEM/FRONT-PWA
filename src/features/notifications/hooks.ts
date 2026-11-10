'use client';

import { usePolling } from '@/hooks/usePolling';
import { listNotifications } from '@/services/notifications';
import type { AppMode } from '@/types/message';

const POLL_INTERVAL_MS = 30_000;
const keepPolling = () => true;

/** Quantas notificações não lidas há no modo (bolinha do sino) */
export function useUnreadNotifications(mode: AppMode) {
  const { data } = usePolling(`unread-notifications-${mode}`, () => listNotifications(mode), keepPolling, POLL_INTERVAL_MS);
  return data?.filter((n) => !n.read).length ?? 0;
}
