import type { ChatMessage } from '@/types/message';
import { formatDuration } from '@/utils/attachments';

/** Texto curto de uma mensagem, para prévias (lista de conversas, notificações) */
export function describeMessage(message: Pick<ChatMessage, 'text' | 'attachments'>) {
  if (message.text) return message.text;
  const [first, ...rest] = message.attachments ?? [];
  if (!first) return '';
  const more = rest.length > 0 ? ` +${rest.length}` : '';
  if (first.type === 'image') return `Foto${more}`;
  if (first.type === 'audio') return `Mensagem de voz${first.durationSeconds ? ` (${formatDuration(first.durationSeconds)})` : ''}`;
  return `${first.name}${more}`;
}
