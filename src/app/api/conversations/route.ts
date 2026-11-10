import { listConversations } from '@/server/messages';
import { modeFromRequest } from '@/server/modeParam';

/** Caixa de mensagens: /api/conversations?modo=motorista traz as do modo motorista */
export async function GET(request: Request) {
  return Response.json(listConversations(modeFromRequest(request)));
}
