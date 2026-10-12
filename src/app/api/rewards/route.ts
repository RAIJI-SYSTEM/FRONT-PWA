import { getRewards } from '@/server/rewards';

export async function GET() {
  return Response.json(getRewards());
}
