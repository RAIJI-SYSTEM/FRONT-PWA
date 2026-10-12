import { cancelDelivery, getDelivery } from '@/server/deliveries';

export async function GET(_request: Request, ctx: RouteContext<'/api/deliveries/[id]'>) {
  const { id } = await ctx.params;
  const delivery = getDelivery(id);
  if (!delivery) return Response.json({ error: 'Entrega não encontrada.' }, { status: 404 });
  return Response.json(delivery);
}

export async function DELETE(_request: Request, ctx: RouteContext<'/api/deliveries/[id]'>) {
  const { id } = await ctx.params;
  const delivery = cancelDelivery(id);
  if (!delivery) return Response.json({ error: 'Entrega não encontrada.' }, { status: 404 });
  return Response.json(delivery);
}
