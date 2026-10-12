import { sendMessage } from '@/server/messages';
import { resolveAttachments } from '@/server/uploads';
import type { SendMessageRequest } from '@/types/message';
import { MAX_ATTACHMENTS_PER_MESSAGE } from '@/utils/attachments';

const MAX_LENGTH = 1000;

export async function POST(request: Request, ctx: RouteContext<'/api/conversations/[id]/messages'>) {
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as SendMessageRequest;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const attachmentIds = Array.isArray(body.attachmentIds) ? body.attachmentIds.filter((x) => typeof x === 'string') : [];

  if (!text && attachmentIds.length === 0) return Response.json({ error: 'Mensagem vazia.' }, { status: 400 });
  if (text.length > MAX_LENGTH) return Response.json({ error: 'Mensagem muito longa.' }, { status: 400 });
  if (attachmentIds.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return Response.json({ error: `Envie no máximo ${MAX_ATTACHMENTS_PER_MESSAGE} arquivos por mensagem.` }, { status: 400 });
  }

  // Só aceita anexos que realmente foram enviados ao armazenamento
  const attachments = resolveAttachments(attachmentIds);
  if (!attachments) return Response.json({ error: 'Anexo não encontrado. Envie o arquivo novamente.' }, { status: 400 });

  const sent = sendMessage(id, text, attachments);
  if (!sent) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
  return Response.json(sent, { status: 201 });
}
