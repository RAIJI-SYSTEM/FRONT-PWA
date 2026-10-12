import { createDelivery, DeliveryError } from '@/server/deliveries';
import type { Place } from '@/types/place';

const isPlace = (p: unknown): p is Place =>
  Boolean(p && typeof p === 'object' && Array.isArray((p as Place).coordinates));

/** "Enviar origem e destino" → "Verificar rotas válidas" */
export async function POST(request: Request) {
  const { origin, destination } = (await request.json().catch(() => ({}))) as { origin?: unknown; destination?: unknown };
  if (!isPlace(origin) || !isPlace(destination)) {
    return Response.json({ error: 'Informe origem e destino.' }, { status: 400 });
  }
  try {
    return Response.json(createDelivery(origin, destination), { status: 201 });
  } catch (error) {
    if (error instanceof DeliveryError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
