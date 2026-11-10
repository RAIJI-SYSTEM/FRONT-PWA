import { listDriversInCity } from '@/server/drivers';
import type { DriverService, PersonType } from '@/types/drivers';

/** Motoristas que atuam numa cidade: /api/drivers?cidade=São Paulo&tipo=pf|pj&servico=rides|deliveries */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const city = params.get('cidade')?.trim();
  if (!city) return Response.json({ error: 'Informe a cidade.' }, { status: 400 });

  const tipo = params.get('tipo');
  const servico = params.get('servico');
  return Response.json(
    listDriversInCity(city, {
      personType: tipo === 'pf' || tipo === 'pj' ? (tipo as PersonType) : undefined,
      service: servico === 'rides' || servico === 'deliveries' ? (servico as DriverService) : undefined,
    }),
  );
}
