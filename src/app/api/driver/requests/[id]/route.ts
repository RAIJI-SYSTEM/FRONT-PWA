import { respondToRequest } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';

/** Aceitar ou recusar um pedido: { action: "accept" | "reject" } */
export async function POST(request: Request, ctx: RouteContext<'/api/driver/requests/[id]'>) {
  const { id } = await ctx.params;
  const { action } = await readJson<{ action: 'accept' | 'reject' }>(request);
  if (action !== 'accept' && action !== 'reject') return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  return handleDriverAction(() => respondToRequest(id, action));
}
