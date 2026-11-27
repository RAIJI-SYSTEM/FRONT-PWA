import { NextResponse, type NextRequest } from 'next/server';
import { decodeJwtSub, logAudit, requestIdFrom, requestIp } from './server/audit';

/**
 * CORS das rotas /api: o app Android (Capacitor) roda em http://localhost e chama este
 * servidor em outro endereço. Libera só origens locais: o app e o navegador do próprio PC
 * (qualquer porta, ex.: testar a pasta out/ servida em http://localhost:8080).
 *
 * Também é o ponto de auditoria de entrada do front: registra método, rota, IP,
 * user-agent e o `sub` quando a requisição traz Authorization. O `x-request-id`
 * é propagado para o BFF/Kong/monólito.
 */
const ALLOWED_ORIGIN = /^(https?|capacitor):\/\/localhost(:\d+)?$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
  'Access-Control-Max-Age': '600',
};

export function proxy(request: NextRequest) {
  const requestId = requestIdFrom(request.headers);
  const headers = new Headers(request.headers);
  headers.set('x-request-id', requestId);

  const origin = request.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGIN.test(origin);

  if (request.method !== 'OPTIONS') {
    logAudit({
      event: 'http_request',
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      actorSub: decodeJwtSub(request.headers.get('authorization')),
      ip: requestIp(headers),
      userAgent: headers.get('user-agent'),
    });
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', ...CORS_HEADERS } : {},
    });
  }

  const response = NextResponse.next({ request: { headers } });
  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  }
  return response;
}

export const config = {
  // Inclui páginas e /api, exceto assets estáticos do Next.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
