/**
 * BFF -> Kong. O navegador/app fala só com este servidor Next (mesma origem na web; no
 * Android, o NEXT_PUBLIC_API_URL), e este servidor chama o Kong. Assim, no deploy, não há
 * CORS nem várias origens: o Kong nem precisa ser público para as chamadas de API.
 *
 * RAIJI_GATEWAY_URL = endereço do Kong visto pelo servidor Next (padrão http://localhost:8000;
 * em Docker/produção, o endereço interno, ex.: http://kong:8000).
 */
export const GATEWAY_URL = (process.env.RAIJI_GATEWAY_URL ?? 'http://localhost:8000').replace(/\/$/, '');

/** Cabeçalhos que passam do app para o Kong (o resto, como cookies e Origin, fica no BFF) */
const FORWARD_REQUEST_HEADERS = ['authorization', 'content-type', 'accept', 'accept-language', 'idempotency-key'];
/** Cabeçalhos da resposta do Kong que voltam para o app */
const FORWARD_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'cache-control', 'location', 'retry-after'];

/** Repassa a requisição para `${GATEWAY_URL}${targetPath}` e devolve a resposta como veio. */
export async function forwardToGateway(request: Request, targetPath: string): Promise<Response> {
  const incoming = new URL(request.url);
  const url = `${GATEWAY_URL}${targetPath}${incoming.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ message: 'O servidor Raiji está fora do ar. Tente de novo em instantes.' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const body = upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

/** Caminho seguro a partir dos segmentos do catch-all (sem "..", sem barras duplas) */
export function joinSegments(segments: string[]) {
  return segments
    .filter((s) => s && s !== '.' && s !== '..')
    .map((s) => encodeURIComponent(s))
    .join('/');
}
