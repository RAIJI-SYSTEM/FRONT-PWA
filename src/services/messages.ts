import type {
  AppMode,
  Attachment,
  ChatMessage,
  Conversation,
  ConversationContext,
  ConversationKind,
  ConversationSummary,
  Participant,
  SendMessageRequest,
} from '@/types/message';
import { ME_ID } from '@/types/message';
import { routes } from '@/utils/routes';
import { stableLink } from '@/utils/stableLinks';
import { getSession } from './auth';
import { ApiError } from './api';
import { chat } from './chat';

// --------------------------------------------------------------- formato do chat

type ChatRole = 'driver' | 'passenger' | 'company';

interface ChatMemberApi {
  userId: string;
  name: string | null;
  role: ChatRole | null;
}

interface ChatContextApi {
  kind: 'ride' | 'delivery';
  /** Carona */
  refId: string;
  label: string;
  origin: string;
  destination: string;
  /** Reserva ou encomenda dentro da carona */
  subId?: string | null;
}

export interface ChatAttachmentApi {
  id: string;
  type: Attachment['type'];
  name: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  url: string | null;
  expiresAt: string;
  expired: boolean;
}

interface ChatMessageApi {
  id: string;
  senderId: string;
  text: string;
  attachments: ChatAttachmentApi[];
  sentAt: string;
}

interface ChatConversationApi {
  _id: string;
  type: 'direct' | 'group';
  context: ChatContextApi | null;
  members: ChatMemberApi[];
  lastMessage: ChatMessageApi | null;
  unreadCount: number;
  group: { name: string } | null;
}

// ------------------------------------------------------------------- conversão

const myId = () => getSession()?.user.id ?? '';

const ROLE_LABEL: Record<ChatRole, string> = { driver: 'Motorista', passenger: 'Passageiro', company: 'Empresa' };

export const toAttachment = (a: ChatAttachmentApi): Attachment => ({
  id: a.id,
  type: a.type,
  name: a.name,
  mimeType: a.mimeType,
  sizeBytes: a.sizeBytes,
  url: a.url && !a.expired ? stableLink(a.id, a.url) : '',
  expired: a.expired || !a.url,
  ...(a.durationSeconds !== undefined ? { durationSeconds: a.durationSeconds } : {}),
});

const toMessage = (m: ChatMessageApi, me: string): ChatMessage => ({
  id: m.id,
  senderId: m.senderId === me ? ME_ID : m.senderId,
  text: m.text,
  attachments: m.attachments.map(toAttachment),
  sentAt: m.sentAt,
});

function contextHref(context: ChatContextApi, mode: AppMode) {
  if (mode === 'driver') return `/motorista/rotas/gerenciar?id=${encodeURIComponent(context.refId)}`;
  if (context.kind === 'delivery') return context.subId ? routes.delivery(context.subId) : '/encomendas';
  return context.subId ? `/viagem/reserva?id=${encodeURIComponent(context.subId)}` : '/corridas';
}

function toSummary(c: ChatConversationApi, me: string): ConversationSummary {
  const mine = c.members.find((m) => m.userId === me);
  const others = c.members.filter((m) => m.userId !== me);
  const mode: AppMode = mine?.role === 'driver' ? 'driver' : 'passenger';
  const other = others[0];
  const kind: ConversationKind =
    c.type === 'group' ? 'group' : (other?.role ?? (mode === 'driver' ? 'passenger' : 'driver'));
  const participants: Participant[] = c.members.map((m) =>
    m.userId === me
      ? { id: ME_ID, name: m.name ?? 'Você', role: 'me' }
      : { id: m.userId, name: m.name ?? (m.role ? ROLE_LABEL[m.role] : 'Contato'), role: m.role ?? (mode === 'driver' ? 'passenger' : 'driver') },
  );
  const context: ConversationContext | undefined = c.context
    ? {
        kind: c.context.kind,
        label: c.context.label,
        origin: c.context.origin,
        destination: c.context.destination,
        href: contextHref(c.context, mode),
      }
    : undefined;
  return {
    id: c._id,
    mode,
    kind,
    title: c.group?.name ?? participants.find((p) => p.id !== ME_ID)?.name ?? 'Conversa',
    subtitle: kind === 'group' ? `${c.members.length} participantes` : ROLE_LABEL[kind as ChatRole] ?? '',
    participants,
    context,
    lastMessage: c.lastMessage ? toMessage(c.lastMessage, me) : undefined,
    unreadCount: c.unreadCount,
  };
}

// ------------------------------------------------------------------------- API

/** Conversas do modo atual: como motorista, ou como passageiro/remetente */
export async function listConversations(mode: AppMode = 'passenger') {
  const me = myId();
  const all = await chat<ChatConversationApi[]>('/conversations?limit=100');
  return all.map((c) => toSummary(c, me)).filter((c) => c.mode === mode);
}

/** Conversa com as últimas mensagens (abrir a conversa a marca como lida) */
export async function getConversation(id: string): Promise<Conversation> {
  const me = myId();
  const [conversation, messages] = await Promise.all([
    chat<ChatConversationApi>(`/conversations/${id}`),
    chat<ChatMessageApi[]>(`/conversations/${id}/messages?limit=100`),
  ]);
  return { ...toSummary(conversation, me), unreadCount: 0, messages: messages.map((m) => toMessage(m, me)) };
}

export async function sendMessage(id: string, request: SendMessageRequest) {
  const sent = await chat<ChatMessageApi>(`/conversations/${id}/messages`, { method: 'POST', body: request });
  return toMessage(sent, myId());
}

/** Com quem e sobre o quê abrir uma conversa direta */
export interface ChatTarget {
  userId: string;
  name?: string | null;
  role: ChatRole;
  myRole: ChatRole;
  context?: ChatContextApi;
}

/** Abre (ou reabre) a conversa direta e devolve o id dela */
export async function openDirectChat(target: ChatTarget) {
  const conversation = await chat<ChatConversationApi>('/conversations/direct', {
    method: 'POST',
    body: {
      userId: target.userId,
      ...(target.name ? { name: target.name } : {}),
      role: target.role,
      myRole: target.myRole,
      ...(target.context ? { context: target.context } : {}),
    },
  });
  return conversation._id;
}

/**
 * Grupo da carona (motorista + passageiros aceitos), criado pelo sistema no primeiro aceite.
 * Devolve o id da conversa, ou null se o grupo ainda não existe.
 */
export async function findRideGroup(rideId: string) {
  try {
    const conversation = await chat<ChatConversationApi>(`/conversations/by-ride/${encodeURIComponent(rideId)}`);
    return conversation._id;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
