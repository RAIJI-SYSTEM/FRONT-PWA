import type { Attachment } from '@/types/message';
import { ApiError } from './api';
import { chat } from './chat';
import { toAttachment, type ChatAttachmentApi } from './messages';

interface UploadTicket {
  attachment: ChatAttachmentApi;
  upload: { method: 'POST'; url: string; fields: Record<string, string>; expiresInSeconds: number };
}

/**
 * Envia um arquivo da conversa ao armazenamento (S3). Os bytes vão DIRETO ao S3 com um link
 * assinado pelo chat; nada fica guardado no servidor do app.
 *   1. o chat registra o anexo e devolve o link de envio;
 *   2. o app envia o arquivo ao S3;
 *   3. a mensagem leva o id do anexo (o chat confere que o arquivo chegou).
 */
export async function uploadFile(conversationId: string, file: File, options?: { durationSeconds?: number }): Promise<Attachment> {
  const mimeType = file.type || 'application/octet-stream';
  const ticket = await chat<UploadTicket>(`/conversations/${conversationId}/attachments`, {
    method: 'POST',
    body: {
      name: file.name || 'arquivo',
      mimeType,
      sizeBytes: file.size,
      ...(options?.durationSeconds !== undefined ? { durationSeconds: options.durationSeconds } : {}),
    },
  });

  // Os campos da política primeiro e o arquivo por último (exigência do S3)
  const form = new FormData();
  for (const [key, value] of Object.entries(ticket.upload.fields)) form.append(key, value);
  form.append('file', file);
  let response: Response;
  try {
    response = await fetch(ticket.upload.url, { method: 'POST', body: form });
  } catch {
    throw new ApiError('Não foi possível enviar o arquivo. Confira a internet.', 0);
  }
  if (!response.ok) throw new ApiError('O armazenamento recusou o arquivo. Tente de novo.', response.status);

  // Até a mensagem voltar do servidor (com o link definitivo), mostra o arquivo local
  return { ...toAttachment(ticket.attachment), url: URL.createObjectURL(file), expired: false };
}
