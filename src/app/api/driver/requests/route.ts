import { listOpenRequests } from '@/server/driverMode';

/** Pedidos abertos (corridas e encomendas) de pessoas da região */
export async function GET() {
  return Response.json(listOpenRequests());
}
