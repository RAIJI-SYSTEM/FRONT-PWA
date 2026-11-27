import { decodeJwtActor, logAudit, requestIdFrom, requestIp } from '@/server/audit';

/**
 * Recebe o beacon de navegação client-side e grava no stdout.
 * Não persiste nada no cliente nem no servidor; a centralização é no Loki.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { path?: unknown } | null;
  const path = typeof body?.path === 'string' ? body.path.slice(0, 300) : '/';

  logAudit({
    event: 'page_view',
    requestId: requestIdFrom(request.headers),
    method: 'POST',
    path,
    status: 204,
    durationMs: 0,
    actorSub: decodeJwtActor(request.headers.get('authorization')).sub,
    actorUsername: decodeJwtActor(request.headers.get('authorization')).username,
    ip: requestIp(request.headers),
    userAgent: request.headers.get('user-agent'),
  });

  return new Response(null, { status: 204 });
}
