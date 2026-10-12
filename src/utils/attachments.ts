import type { AttachmentType } from '@/types/message';

/** Regras de anexo usadas no navegador (validação/accept) e no servidor (segurança) */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;
/** Limite da mensagem de voz */
export const MAX_VOICE_SECONDS = 120;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/aac'];

/** Valor do atributo `accept` dos inputs de arquivo */
export const ACCEPT_IMAGES = IMAGE_TYPES.join(',');
export const ACCEPT_DOCUMENTS = [...DOCUMENT_TYPES, '.doc', '.docx', '.xls', '.xlsx', '.pdf', '.txt'].join(',');

/** "audio/webm;codecs=opus" → "audio/webm" */
export const baseMimeType = (mimeType: string) => mimeType.split(';')[0].trim().toLowerCase();

/** Tipo do anexo a partir do MIME, ou null se não for permitido (SVG e HTML ficam de fora por segurança) */
export function attachmentTypeFor(mimeType: string): AttachmentType | null {
  const mime = baseMimeType(mimeType);
  if (IMAGE_TYPES.includes(mime)) return 'image';
  if (DOCUMENT_TYPES.includes(mime)) return 'document';
  if (AUDIO_TYPES.includes(mime)) return 'audio';
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** 75 → "1:15" */
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Extensão em maiúsculas para mostrar no card do documento: "PDF", "DOCX" */
export function fileExtension(name: string) {
  const ext = name.split('.').pop();
  return ext && ext !== name ? ext.toUpperCase() : 'ARQUIVO';
}
