/**
 * Auditoria do FRONT-PWA.
 *
 * O token fica no navegador (localStorage), então o servidor só consegue
 * identificar o usuário quando a requisição traz o header Authorization — é o
 * caso de todas as chamadas BFF. Navegações de página são registradas sem ator.
 *
 * Não registra corpo, query string nem conteúdo de tela.
 */

export interface FrontAuditEvent {
  event: "http_request" | "bff_request" | "page_view";
  requestId: string;
  method: string;
  path: string;
  status?: number | null;
  durationMs?: number;
  actorSub?: string | null;
  actorUsername?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface JwtActor {
  sub: string | null;
  username: string | null;
}

/** Decodifica apenas o payload do JWT para obter `sub` e `preferred_username`. */
export function decodeJwtActor(authorization: string | null): JwtActor {
  const empty = { sub: null, username: null };
  if (!authorization) return empty;
  const trimmed = authorization.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) return empty;
  const parts = trimmed.slice(7).trim().split(".");
  if (parts.length < 2) return empty;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
      sub?: unknown;
      preferred_username?: unknown;
      email?: unknown;
    };
    return {
      sub: typeof payload.sub === "string" && payload.sub ? payload.sub : null,
      username:
        typeof payload.preferred_username === "string" && payload.preferred_username
          ? payload.preferred_username
          : typeof payload.email === "string" && payload.email
            ? payload.email
            : null,
    };
  } catch {
    return empty;
  }
}

/** Mantido para compatibilidade: só o `sub`. */
export function decodeJwtSub(authorization: string | null): string | null {
  return decodeJwtActor(authorization).sub;
}

export function requestIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return headers.get("x-real-ip");
}

export function requestIdFrom(headers: Headers): string {
  return headers.get("x-request-id") || headers.get("x-kong-request-id") || crypto.randomUUID();
}

export function logAudit(event: FrontAuditEvent): void {
  const payload = {
    ...event,
    service: "front-pwa",
    at: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}
