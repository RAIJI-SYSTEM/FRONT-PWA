import type { ChatMessage, Conversation, ConversationSummary, SendMessageRequest } from '@/types/message';
import { apiFetch } from './api';

export const listConversations = () => apiFetch<ConversationSummary[]>('/api/conversations');

export const getConversation = (id: string) => apiFetch<Conversation>(`/api/conversations/${id}`);

export const sendMessage = (id: string, request: SendMessageRequest) =>
  apiFetch<ChatMessage>(`/api/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(request) });
