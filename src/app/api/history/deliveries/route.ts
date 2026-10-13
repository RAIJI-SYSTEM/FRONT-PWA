import { listDeliveries } from '@/server/history';

export async function GET() {
  return Response.json(listDeliveries());
}
