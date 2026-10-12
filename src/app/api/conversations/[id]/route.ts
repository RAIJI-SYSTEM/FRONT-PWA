import { getConversation } from '@/server/messages';

/** Abre a conversa (e marca as mensagens como lidas) */
export async function GET(_request: Request, ctx: RouteContext<'/api/conversations/[id]'>) {
  const { id } = await ctx.params;
  const conversation = getConversation(id);
  if (!conversation) return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
  return Response.json(conversation);
}
