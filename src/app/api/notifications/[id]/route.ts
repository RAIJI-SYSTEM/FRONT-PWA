import { modeFromRequest } from '@/server/modeParam';
import { removeNotification } from '@/server/notifications';

export async function DELETE(request: Request, ctx: RouteContext<'/api/notifications/[id]'>) {
  const { id } = await ctx.params;
  if (!removeNotification(modeFromRequest(request), id)) return Response.json({ error: 'Notificação não encontrada.' }, { status: 404 });
  return new Response(null, { status: 204 });
}
