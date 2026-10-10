import { createRideSearch } from '@/server/rideSearches';
import type { RideSearchRequest } from '@/types/ride';

function isValidRequest(body: Partial<RideSearchRequest>): body is RideSearchRequest {
  const hasPlace = (p: unknown) =>
    Boolean(p && typeof p === 'object' && Array.isArray((p as { coordinates?: unknown }).coordinates));
  const departure = body.departure;
  const validDeparture =
    departure?.type === 'now' || (departure?.type === 'scheduled' && !Number.isNaN(Date.parse(departure.at)));
  return hasPlace(body.origin) && hasPlace(body.destination) && validDeparture;
}

/** Passageiro envia os dados da procura ("Enviar dados da procura" no BPMN) */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<RideSearchRequest>;
  if (!isValidRequest(body)) {
    return Response.json({ error: 'Origem, destino e horário são obrigatórios.' }, { status: 400 });
  }
  return Response.json(createRideSearch(body), { status: 201 });
}
