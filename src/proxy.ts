import { NextResponse, type NextRequest } from 'next/server';

/**
 * CORS das rotas /api: o app Android (Capacitor) roda em http://localhost e chama este
 * servidor em outro endereço. Libera só origens locais: o app e o navegador do próprio PC
 * (qualquer porta, ex.: testar a pasta out/ servida em http://localhost:8080).
 */
const ALLOWED_ORIGIN = /^(https?|capacitor):\/\/localhost(:\d+)?$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '600',
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGIN.test(origin);

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', ...CORS_HEADERS } : {},
    });
  }

  const response = NextResponse.next();
  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
