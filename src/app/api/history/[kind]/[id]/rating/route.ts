import { rateDriver, RatingError } from '@/server/history';
import type { HistoryKind, RateDriverRequest } from '@/types/history';

const KINDS: HistoryKind[] = ['rides', 'deliveries'];

/** Avaliar o motorista de uma corrida (/api/history/rides/:id/rating) ou encomenda (deliveries) */
export async function POST(request: Request, ctx: RouteContext<'/api/history/[kind]/[id]/rating'>) {
  const { kind, id } = await ctx.params;
  if (!KINDS.includes(kind as HistoryKind)) return Response.json({ error: 'Tipo inválido.' }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as RateDriverRequest;
  try {
    return Response.json(rateDriver(kind as HistoryKind, id, body));
  } catch (error) {
    if (error instanceof RatingError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
