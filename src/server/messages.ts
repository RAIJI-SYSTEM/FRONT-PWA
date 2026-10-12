/**
 * SIMULAÇÃO das conversas para desenvolvimento: dados em memória, com respostas
 * automáticas do motorista. Em produção, use o backend real com WebSocket/SSE
 * (ou um serviço de chat) e push notifications.
 */
import {
  ME_ID,
  SYSTEM_ID,
  type Attachment,
  type ChatMessage,
  type Conversation,
  type ConversationSummary,
  type Participant,
} from '@/types/message';
import { getUpload } from './uploads';

interface StoredConversation extends Omit<Conversation, 'lastMessage' | 'unreadCount' | 'typing'> {
  /** Até qual mensagem o usuário já leu */
  lastReadAt: number;
  /** Resposta simulada que "chega" depois de alguns segundos */
  pendingReply?: { senderId: string; text: string; at: number };
}

const REPLY_DELAY_MS = 3000;
const DRIVER_REPLIES = [
  'Combinado! 👍',
  'Certo, já estou a caminho.',
  'Sem problemas, te aviso quando chegar.',
  'Ok! Qualquer coisa me chama por aqui.',
];

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

let messageSeq = 0;
const message = (senderId: string, text: string, sentAt: string, attachments?: Attachment[]): ChatMessage => ({
  id: `m${++messageSeq}`,
  senderId,
  text,
  sentAt,
  ...(attachments?.length ? { attachments } : {}),
});

/** Anexos de exemplo gerados em server/uploads.ts */
const seedAttachment = (id: string) => {
  const attachment = getUpload(id)?.attachment;
  return attachment ? [attachment] : undefined;
};

const me: Participant = { id: ME_ID, name: 'Você', role: 'me' };

function seed(): Map<string, StoredConversation> {
  const carlos: Participant = { id: 'carlos', name: 'Carlos Souza', role: 'driver' };
  const marcos: Participant = { id: 'marcos', name: 'Marcos Alves', role: 'driver' };
  const ana: Participant = { id: 'ana', name: 'Ana Ribeiro', role: 'passenger' };
  const joao: Participant = { id: 'joao', name: 'João Pedro', role: 'passenger' };
  const bia: Participant = { id: 'bia', name: 'Beatriz Lima', role: 'passenger' };
  const lima: Participant = { id: 'lima', name: 'Transportes Lima', role: 'driver' };

  const conversations: StoredConversation[] = [
    {
      id: 'carlos-aeroporto',
      kind: 'driver',
      title: carlos.name,
      subtitle: 'Onix prata · ABC1D23',
      participants: [me, carlos],
      context: { kind: 'ride', label: 'Corrida', origin: 'Casa', destination: 'Aeroporto de Guarulhos', href: '/corridas' },
      messages: [
        message(SYSTEM_ID, 'Carlos aceitou sua corrida', minutesAgo(50)),
        message(carlos.id, 'Boa noite! Estarei aí às 20h10.', minutesAgo(48)),
        message(ME_ID, 'Perfeito, obrigado!', minutesAgo(45)),
        message(carlos.id, 'Vou de Onix prata, placa ABC1D23. Te aviso quando estiver chegando.', minutesAgo(3)),
      ],
      lastReadAt: Date.now() - 45 * 60_000,
    },
    {
      id: 'grupo-campinas',
      kind: 'group',
      title: 'Viagem para Campinas',
      subtitle: '5 participantes',
      participants: [me, marcos, ana, joao, bia],
      context: { kind: 'ride', label: 'Corrida compartilhada', origin: 'Av. Paulista, 1000', destination: 'Campinas', href: '/corridas' },
      messages: [
        message(SYSTEM_ID, 'Marcos criou o grupo da viagem', minutesAgo(180)),
        message(marcos.id, 'Bom dia, pessoal! Saída amanhã às 7h em ponto, na Av. Paulista, 1000.', minutesAgo(178)),
        message(ana.id, 'Posso levar uma mala grande?', minutesAgo(120)),
        message(marcos.id, 'Pode sim, tem espaço no porta-malas.', minutesAgo(118)),
        message(marcos.id, 'Ponto de encontro: em frente à banca 👇', minutesAgo(90), seedAttachment('seed-ponto-encontro')),
        message(ME_ID, 'Vou chegar uns 5 minutos antes.', minutesAgo(60)),
        message(joao.id, 'Alguém sabe se tem parada no caminho?', minutesAgo(12)),
        message(bia.id, 'Acho que não, são só 1h20 de viagem 😅', minutesAgo(10)),
        message(ana.id, '', minutesAgo(8), seedAttachment('seed-audio')),
      ],
      lastReadAt: Date.now() - 60 * 60_000,
    },
    {
      id: 'lima-encomenda',
      kind: 'driver',
      title: lima.name,
      subtitle: 'Spin preta · RTY7U89',
      participants: [me, lima],
      context: { kind: 'delivery', label: 'Encomenda #H62J568107', origin: 'Av. Paulista, 1000', destination: 'R. Augusta, 250', href: '/encomendas' },
      messages: [
        message(SYSTEM_ID, 'Transportes Lima aceitou sua entrega', minutesAgo(1500)),
        message(lima.id, 'Pacote coletado! Previsão de entrega às 18h30.', minutesAgo(1490)),
        message(lima.id, '', minutesAgo(1489), seedAttachment('seed-comprovante')),
        message(ME_ID, 'Ótimo, obrigado!', minutesAgo(1480)),
      ],
      lastReadAt: Date.now(),
    },
  ];
  return new Map(conversations.map((c) => [c.id, c]));
}

// A chave tem versão: ao mudar o formato dos dados de exemplo, troque-a para o `next dev` recriar tudo
const globalStore = globalThis as unknown as { conversationsV2?: Map<string, StoredConversation> };
const conversations = (globalStore.conversationsV2 ??= seed());

/** Entrega a resposta simulada quando o "tempo de digitação" passa */
function deliverPendingReply(conversation: StoredConversation) {
  const reply = conversation.pendingReply;
  if (reply && Date.now() >= reply.at) {
    conversation.messages.push(message(reply.senderId, reply.text, new Date(reply.at).toISOString()));
    conversation.pendingReply = undefined;
  }
}

function toSummary(conversation: StoredConversation): ConversationSummary {
  deliverPendingReply(conversation);
  const { messages, lastReadAt, pendingReply, ...rest } = conversation;
  void pendingReply;
  return {
    ...rest,
    lastMessage: messages.at(-1),
    unreadCount: messages.filter((m) => m.senderId !== ME_ID && Date.parse(m.sentAt) > lastReadAt).length,
  };
}

export function listConversations(): ConversationSummary[] {
  return [...conversations.values()]
    .map(toSummary)
    .sort((a, b) => Date.parse(b.lastMessage?.sentAt ?? '0') - Date.parse(a.lastMessage?.sentAt ?? '0'));
}

/** Abre a conversa e marca tudo como lido */
export function getConversation(id: string): Conversation | null {
  const conversation = conversations.get(id);
  if (!conversation) return null;
  deliverPendingReply(conversation);
  conversation.lastReadAt = Date.now();

  const typingId = conversation.pendingReply?.senderId;
  return {
    ...toSummary(conversation),
    unreadCount: 0,
    messages: conversation.messages,
    typing: conversation.participants.find((p) => p.id === typingId)?.name,
  };
}

export function sendMessage(id: string, text: string, attachments: Attachment[] = []): ChatMessage | null {
  const conversation = conversations.get(id);
  if (!conversation) return null;

  const sent = message(ME_ID, text, new Date().toISOString(), attachments);
  conversation.messages.push(sent);
  conversation.lastReadAt = Date.now();

  // Simulação: o motorista responde alguns segundos depois
  const driver = conversation.participants.find((p) => p.role === 'driver');
  if (conversation.kind === 'driver' && driver && !conversation.pendingReply) {
    conversation.pendingReply = {
      senderId: driver.id,
      text: attachments.length > 0 && !text ? 'Recebi, obrigado!' : DRIVER_REPLIES[Math.floor(Math.random() * DRIVER_REPLIES.length)],
      at: Date.now() + REPLY_DELAY_MS,
    };
  }
  return sent;
}
