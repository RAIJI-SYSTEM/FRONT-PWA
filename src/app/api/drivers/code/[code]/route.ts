import { findDriverByCode } from '@/server/drivers';

/** Motorista pelo código amigável de 8 dígitos */
export async function GET(_request: Request, ctx: RouteContext<'/api/drivers/code/[code]'>) {
  const { code } = await ctx.params;
  const result = findDriverByCode(code);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.driver);
}
