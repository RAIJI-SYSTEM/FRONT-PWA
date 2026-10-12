'use client';

import { usePolling } from '@/hooks/usePolling';
import { listConversations } from '@/services/messages';

const POLL_INTERVAL_MS = 30_000;
const keepPolling = () => true;

/** Total de mensagens não lidas, para a bolinha do botão de mensagens */
export function useUnreadMessages() {
  const { data } = usePolling('unread-messages', listConversations, keepPolling, POLL_INTERVAL_MS);
  return data?.reduce((total, conversation) => total + conversation.unreadCount, 0) ?? 0;
}
