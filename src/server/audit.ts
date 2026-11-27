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
  ip?: string | null;
  userAgent?: string | null;
}

/** Decodifica apenas o payload do JWT para obter o `sub` (a validação é do Kong). */
export function decodeJwtSub(authorization: string | null): string | null {
  if (!authorization) return null;
  const trimmed = authorization.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) return null;
  const parts = trimmed.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { sub?: unknown };
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
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
