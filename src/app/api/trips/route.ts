import { searchTrips } from '@/server/drivers';

/** Viagens publicadas entre duas cidades: /api/trips?de=São Paulo&para=Campinas&data=2026-10-14 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const from = params.get('de')?.trim();
  const to = params.get('para')?.trim();
  const date = params.get('data') ?? undefined;
  if (!from || !to) return Response.json({ error: 'Informe as duas cidades.' }, { status: 400 });
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: 'Data inválida.' }, { status: 400 });
  return Response.json(searchTrips(from, to, date));
}
