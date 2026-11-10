import { rateCustomer } from '@/server/driverMode';
import { handleDriverAction, readJson } from '@/server/driverModeHttp';
import type { RateDriverRequest } from '@/types/history';

/** O motorista avalia o passageiro/remetente de uma viagem concluída */
export async function POST(request: Request, ctx: RouteContext<'/api/driver/jobs/[id]/rating'>) {
  const { id } = await ctx.params;
  const body = await readJson<RateDriverRequest>(request);
  return handleDriverAction(() => rateCustomer(id, body));
}
