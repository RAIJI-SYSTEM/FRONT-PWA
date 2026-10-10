import { cancelRideSearch, getRideSearch } from '@/server/rideSearches';

/** Consultado periodicamente pela tela de espera */
export async function GET(_request: Request, ctx: RouteContext<'/api/searches/[id]'>) {
  const { id } = await ctx.params;
  const search = getRideSearch(id);
  if (!search) return Response.json({ error: 'Busca não encontrada.' }, { status: 404 });
  return Response.json(search);
}

/** Passageiro desiste da busca */
export async function DELETE(_request: Request, ctx: RouteContext<'/api/searches/[id]'>) {
  const { id } = await ctx.params;
  const search = cancelRideSearch(id);
  if (!search) return Response.json({ error: 'Busca não encontrada.' }, { status: 404 });
  return Response.json(search);
}
