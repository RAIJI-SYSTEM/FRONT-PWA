import { cancelRoute } from '@/server/driverMode';
import { handleDriverAction } from '@/server/driverModeHttp';

/** Cancelar uma rota publicada */
export async function DELETE(_request: Request, ctx: RouteContext<'/api/driver/routes/[id]'>) {
  const { id } = await ctx.params;
  return handleDriverAction(() => cancelRoute(id));
}
