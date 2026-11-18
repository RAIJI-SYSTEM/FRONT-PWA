import { forwardToGateway, joinSegments } from '@/server/gateway';

/**
 * BFF do serviço de chat: /api/chat/conversations -> Kong /chat/conversations -> raiji-chat.
 * Usa o MESMO token do login (Keycloak); o Kong e o chat validam.
 */
async function handle(request: Request, ctx: RouteContext<'/api/chat/[...path]'>) {
  const { path } = await ctx.params;
  return forwardToGateway(request, `/chat/${joinSegments(path)}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
