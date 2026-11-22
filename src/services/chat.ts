import { ApiError, apiUrl } from './api';
import { getAccessToken } from './auth';

/**
 * Cliente do serviço de chat (raiji-chat) pelo BFF: /api/chat/... -> Kong /chat/... -> chat.
 * Mesmo token do login. Os erros do chat vêm como { error: "codigo" }.
 */

const ERRORS: Record<string, string> = {
  conversation_not_found: 'Conversa não encontrada.',
  invalid_recipient: 'Não é possível conversar com você mesmo.',
  empty_message: 'Escreva uma mensagem ou anexe um arquivo.',
  unsupported_media_type: 'Tipo de arquivo não aceito.',
  file_too_large: 'Arquivo maior que 10 MB.',
  storage_unavailable: 'Envio de arquivos indisponível no momento.',
  attachment_not_uploaded: 'O arquivo não terminou de enviar. Tente de novo.',
  attachment_expired: 'O arquivo expirou. Envie de novo.',
  invalid_attachments: 'Anexo inválido. Envie de novo.',
  missing_token: 'Entre na sua conta para continuar.',
  invalid_token: 'Sua sessão expirou. Entre de novo.',
};

export async function chat<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError('Entre na sua conta para continuar.', 401);
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/chat${path}`), {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError('Sem conexão com o chat. Confira a internet.', 0);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error as string | undefined;
    const message =
      (code && ERRORS[code]) ||
      (response.status === 503 || response.status === 502 ? 'O chat está fora do ar. Tente de novo em instantes.' : 'Não foi possível concluir. Tente de novo.');
    throw new ApiError(message, response.status);
  }
  return body as T;
}
