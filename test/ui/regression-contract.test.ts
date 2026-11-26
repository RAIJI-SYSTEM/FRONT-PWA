import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Teste de Regressão — FRONT-PWA
 *
 * Congela o contrato observável usado pelo app: formato de erro, códigos HTTP,
 * repasse do BFF e rotas de autenticação. Se uma mudança quebrar esse contrato,
 * estes testes falham antes de chegar ao usuário.
 */

const state = vi.hoisted(() => ({ token: "token-123" as string | null }));
vi.mock("@/services/auth", () => ({ getAccessToken: vi.fn(async () => state.token) }));

import { POST as logoutRoute } from "@/app/api/auth/logout/route";
import { POST as tokenRoute } from "@/app/api/auth/token/route";
import { POST as chatRoute } from "@/app/api/chat/[...path]/route";
import { POST as raijiRoute } from "@/app/api/raiji/[...path]/route";
import { ApiError, apiFetch } from "@/services/api";
import { backend, fromBrazilLocal, toBrazilLocal, toCents, toReais } from "@/services/backend/client";
import { GATEWAY_URL, forwardToGateway, joinSegments } from "@/server/gateway";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.unstubAllGlobals();
  state.token = "token-123";
});

describe("[Regressão] contrato de erro do cliente do app", () => {
  it("ApiError mantém nome, mensagem, status, campos e stack", () => {
    const error = new ApiError("Placa inválida", 400, { plate: "obrigatória" });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("Error");
    expect(error.message).toBe("Placa inválida");
    expect(error.status).toBe(400);
    expect(error.fields).toEqual({ plate: "obrigatória" });
    expect(error.stack).toBeTruthy();
  });

  it("apiFetch usa o campo error do servidor e preserva fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ error: "invalid_request", fields: { model: "obrigatório" } }, 400)),
    );

    await expect(apiFetch("/api/x")).rejects.toMatchObject({
      message: "invalid_request",
      status: 400,
      fields: { model: "obrigatório" },
    });
  });

  it("apiFetch usa mensagem padrão quando o erro não tem corpo JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>erro</html>", { status: 500 })));

    await expect(apiFetch("/api/x")).rejects.toMatchObject({
      message: "Erro inesperado. Tente novamente.",
      status: 500,
      fields: undefined,
    });
  });

  it("backend aceita 204 sem corpo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    await expect(backend("/api/rides/r1/requests/req1")).resolves.toBeUndefined();
  });

  it("backend devolve null para 200 com corpo vazio", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })));

    await expect(backend("/api/rides/r1")).resolves.toBeNull();
  });

  it("backend prioriza message sobre error na resposta de falha", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Mensagem para o usuário", error: "codigo_interno" }, 409)));

    await expect(backend("/api/rides")).rejects.toMatchObject({
      status: 409,
      message: "Mensagem para o usuário",
    });
  });

  it("conversões de dinheiro e horário continuam estáveis", () => {
    expect(toCents(12.345)).toBe(1235);
    expect(toCents(null)).toBe(0);
    expect(toReais(1235)).toBe(12.35);
    expect(toReais(null)).toBeNull();
    expect(toBrazilLocal("2026-11-20T11:00:00Z")).toBe("2026-11-20T08:00:00");
    expect(fromBrazilLocal("2026-11-20T08:00:00")).toBe("2026-11-20T11:00:00.000Z");
  });
});

describe("[Regressão] contrato do BFF", () => {
  it("joinSegments remove vazio, ponto e ponto-ponto", () => {
    expect(joinSegments(["rides", "", ".", "..", "r1"])).toBe("rides/r1");
    expect(joinSegments(["a b", "c/d"])).toBe("a%20b/c%2Fd");
  });

  it("mantém método, query, corpo e somente cabeçalhos permitidos", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://app.local/api/raiji/rides?x=1", {
      method: "POST",
      headers: {
        authorization: "Bearer t",
        "content-type": "application/json",
        "idempotency-key": "idem-1",
        cookie: "sessao=1",
        origin: "http://app.local",
      },
      body: JSON.stringify({ a: 1 }),
    });

    const response = await forwardToGateway(request, "api/rides");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(response.status).toBe(201);
    expect(url).toBe(`${GATEWAY_URL}api/rides?x=1`);
    expect(init.method).toBe("POST");
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("idempotency-key")).toBe("idem-1");
    expect(headers.get("cookie")).toBeNull();
    expect(headers.get("origin")).toBeNull();
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"a":1}');
  });

  it("GET e HEAD não enviam corpo; 204 e 304 voltam sem corpo", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const get = await forwardToGateway(new Request("http://app.local/api/raiji/rides"), "api/rides");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).body).toBeUndefined();
    expect(get.status).toBe(204);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 304 })));
    const notModified = await forwardToGateway(new Request("http://app.local/api/raiji/rides"), "api/rides");
    expect(notModified.status).toBe(304);
  });
});

describe("[Regressão] rotas de autenticação e proxy", () => {
  it("token vai para o realm configurado no Keycloak", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ access_token: "a" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await tokenRoute(
      new Request("http://app.local/api/auth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "grant_type=password",
      }),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/realms/raiji/protocol/openid-connect/token`);
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe("grant_type=password");
  });

  it("logout vai para o endpoint do Keycloak", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await logoutRoute(new Request("http://app.local/api/auth/logout", { method: "POST" }));

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      `${GATEWAY_URL}/realms/raiji/protocol/openid-connect/logout`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("proxy do backend preserva método e corpo", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ id: "r1" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    const response = await raijiRoute(
      new Request("http://app.local/api/raiji/rides", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer t" },
        body: '{"x":1}',
      }),
      { params: Promise.resolve({ path: ["rides"] }) } as never,
    );

    expect(response.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}/api/rides`);
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"x":1}');
  });

  it("proxy do chat preserva método DELETE", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await chatRoute(
      new Request("http://app.local/api/chat/conversations/abc", { method: "DELETE" }),
      { params: Promise.resolve({ path: ["conversations", "abc"] }) } as never,
    );

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      `${GATEWAY_URL}/chat/conversations/abc`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
