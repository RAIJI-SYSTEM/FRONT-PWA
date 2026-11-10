/** Modo do app em que a conversa aparece: como passageiro ou como motorista */
export type AppMode = 'passenger' | 'driver';

/**
 * - driver: conversa direta com o motorista (modo passageiro)
 * - passenger: conversa direta com um passageiro (modo motorista)
 * - company: conversa com uma empresa que envia encomendas (modo motorista)
 * - group: grupo de quem divide a mesma viagem
 */
export type ConversationKind = 'driver' | 'passenger' | 'company' | 'group';

export type ParticipantRole = 'me' | 'driver' | 'passenger' | 'company';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
}

export type AttachmentType = 'image' | 'document' | 'audio';

/** Arquivo já enviado ao armazenamento (hoje simulado em /api/uploads) */
export interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  /** Mensagens de voz: duração em segundos (o navegador nem sempre consegue ler do arquivo) */
  durationSeconds?: number;
}

export interface ChatMessage {
  id: string;
  /** ID do participante, ou 'system' para avisos automáticos ("Carlos entrou no grupo") */
  senderId: string;
  /** Pode ser vazio quando a mensagem é só um anexo (foto, documento ou voz) */
  text: string;
  attachments?: Attachment[];
  sentAt: string; // ISO 8601
}

/** O cliente envia só os IDs: o servidor confere se os anexos existem antes de aceitar */
export interface SendMessageRequest {
  text?: string;
  attachmentIds?: string[];
}

/** Corrida ou encomenda à qual a conversa pertence */
export interface ConversationContext {
  kind: 'ride' | 'delivery';
  label: string;
  origin: string;
  destination: string;
  href: string;
}

export interface ConversationSummary {
  id: string;
  mode: AppMode;
  kind: ConversationKind;
  title: string;
  /** Ex.: veículo do motorista, ou "4 participantes" */
  subtitle: string;
  participants: Participant[];
  context?: ConversationContext;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[];
  /** Nome de quem está digitando agora, se houver */
  typing?: string;
}

export const ME_ID = 'me';
export const SYSTEM_ID = 'system';
