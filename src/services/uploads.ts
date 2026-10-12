import type { Attachment } from '@/types/message';
import { ApiError } from './api';

/** Envia um arquivo ao armazenamento e devolve o anexo pronto para usar numa mensagem */
export async function uploadFile(file: File, options?: { durationSeconds?: number }): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  if (options?.durationSeconds !== undefined) form.append('durationSeconds', String(options.durationSeconds));

  // Sem Content-Type manual: o navegador monta o multipart com o boundary correto
  const response = await fetch('/api/uploads', { method: 'POST', body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? 'Falha ao enviar o arquivo.', response.status);
  return body as Attachment;
}
