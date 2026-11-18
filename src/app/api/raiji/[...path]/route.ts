import { forwardToGateway, joinSegments } from '@/server/gateway';

/**
 * BFF do backend Raiji (monolito): /api/raiji/rides/search -> Kong /api/rides/search.
 * O token do usuário vai no Authorization e quem valida é o Kong/monolito.
 */
async function handle(request: Request, ctx: RouteContext<'/api/raiji/[...path]'>) {
  const { path } = await ctx.params;
  return forwardToGateway(request, `/api/${joinSegments(path)}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
