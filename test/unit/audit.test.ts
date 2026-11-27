import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeJwtSub, logAudit, requestIdFrom, requestIp } from "@/server/audit";

function token(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.assinatura`;
}

describe("auditoria do front", () => {
  afterEach(() => vi.restoreAllMocks());

  it("extrai o sub do JWT sem validar assinatura", () => {
    expect(decodeJwtSub(`Bearer ${token({ sub: "user-1" })}`)).toBe("user-1");
    expect(decodeJwtSub(`bearer ${token({ sub: "user-2", name: "João" })}`)).toBe("user-2");
    expect(decodeJwtSub(null)).toBeNull();
    expect(decodeJwtSub("Basic abc")).toBeNull();
    expect(decodeJwtSub("Bearer sem-pontos")).toBeNull();
    expect(decodeJwtSub("Bearer a.b")).toBeNull();
    expect(decodeJwtSub(`Bearer ${token({ name: "sem sub" })}`)).toBeNull();
  });

  it("lê IP encaminhado e gera request id quando ausente", () => {
    expect(requestIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(requestIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(requestIp(new Headers())).toBeNull();

    expect(requestIdFrom(new Headers({ "x-request-id": "req-1" }))).toBe("req-1");
    expect(requestIdFrom(new Headers({ "x-kong-request-id": "kong-1" }))).toBe("kong-1");
    expect(requestIdFrom(new Headers())).toMatch(/[0-9a-f-]{36}/);
  });

  it("emite JSON estruturado com service e timestamp", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logAudit({
      event: "bff_request",
      requestId: "req-1",
      method: "POST",
      path: "/api/rides",
      status: 201,
      durationMs: 12,
      actorSub: "user-1",
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload).toMatchObject({
      service: "front-pwa",
      event: "bff_request",
      requestId: "req-1",
      method: "POST",
      path: "/api/rides",
      status: 201,
      actorSub: "user-1",
    });
    expect(payload.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
