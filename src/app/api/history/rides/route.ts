import { listRides } from '@/server/history';

export async function GET() {
  return Response.json(listRides());
}
