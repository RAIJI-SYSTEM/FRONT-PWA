import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Análise de Falhas — FRONT-PWA
 *
 * Estes testes não alteram a aplicação: eles exercitam os caminhos de falha do
 * BFF e dos clientes HTTP para garantir que o erro chegue ao app com status,
 * mensagem e contexto suficientes para diagnóstico.
 */

const state = vi.hoisted(() => ({ token: "token-123" as string | null }));
vi.mock("@/services/auth", () => ({ getAccessToken: vi.fn(async () => state.token) }));

import { POST as tokenRoute } from "@/app/api/auth/token/route";
import { GET as chatRoute } from "@/app/api/chat/[...path]/route";
import { GET as raijiRoute } from "@/app/api/raiji/[...path]/route";
import { ApiError, apiFetch } from "@/services/api";
import { backend } from "@/services/backend/client";
import { GATEWAY_URL, forwardToGateway } from "@/server/gateway";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.unstubAllGlobals();
  state.token = "token-123";
});

describe("[Análise de Falhas] cliente HTTP do app", () => {
  it("não esconde falha de rede: apiFetch rejeita com o erro original", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));

    await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(TypeError);
  });

  it("não esconde timeout/abort: backend rejeita com AbortError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    }));

    await expect(backend("/api/rides")).rejects.toMatchObject({ name: "AbortError" });
  });

  it("trata resposta 502 do BFF sem JSON como falha de servidor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad Gateway", { status: 502 })));

    await expect(backend("/api/rides")).rejects.toMatchObject({
      status: 502,
      message: "O servidor está com problemas. Tente de novo em instantes.",
    });
  });

  it("preserva a mensagem de indisponibilidade enviada pelo BFF", async () => {
    const message = "O servidor Raiji está fora do ar. Tente de novo em instantes.";
    vi.stubGlobal("fetch", vi.fn(async () => json({ message }, 502)));

    await expect(backend("/api/rides")).rejects.toMatchObject({ status: 502, message });
  });

  it("classifica 401, 403, 404 e 500 com mensagens acionáveis", async () => {
    const cases: Array<[number, string]> = [
      [401, "Sua sessão expirou. Entre de novo."],
      [403, "Você não tem permissão para isso."],
      [404, "Não encontrado."],
      [500, "O servidor está com problemas. Tente de novo em instantes."],
    ];

    for (const [status, expected] of cases) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status })));
      await expect(backend("/api/rides")).rejects.toMatchObject({ status, message: expected });
    }
  });

  it("mantém os erros por campo para exibição no formulário", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ message: "Dados inválidos", fields: { plate: "Placa inválida" } }, 400)),
    );

    const error = await backend("/api/vehicles").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, fields: { plate: "Placa inválida" } });
  });
});

describe("[Análise de Falhas] BFF -> Kong", () => {
  it("repassa erro 5xx do upstream com o corpo original", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("stack trace interno", { status: 500 })));

    const response = await forwardToGateway(new Request("http://app.local/api/raiji/rides"), "api/rides");

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe("stack trace interno");
  });

  it("repassa 401 do upstream sem transformar em sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "invalid_token" }, 401)));

    const response = await forwardToGateway(new Request("http://app.local/api/raiji/me"), "api/me");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "invalid_token" });
  });

  it("transforma indisponibilidade do Kong em 502 com mensagem amigável", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const response = await forwardToGateway(new Request("http://app.local/api/chat/conversations"), "chat/conversations");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringContaining("fora do ar") });
  });
});

describe("[Análise de Falhas] rotas de autenticação e proxy", () => {
  it("rota de token devolve o erro do Keycloak ao app", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "invalid_grant" }, 400)));

    const response = await tokenRoute(
      new Request("http://app.local/api/auth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "grant_type=refresh_token&refresh_token=expirado",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_grant" });
  });

  it("rota de token responde 502 quando o Keycloak está fora do ar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const response = await tokenRoute(new Request("http://app.local/api/auth/token", { method: "POST" }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringContaining("fora do ar") });
  });

  it("rota de chat mantém o caminho e a query ao repassar ao Kong", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await chatRoute(
      new Request("http://app.local/api/chat/conversations/abc/messages?limit=20"),
      { params: Promise.resolve({ path: ["conversations", "abc", "messages"] }) } as never,
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `${GATEWAY_URL}/chat/conversations/abc/messages?limit=20`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rota do backend monta /api/... e não permite escapar do caminho", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await raijiRoute(
      new Request("http://app.local/api/raiji/rides/search?kind=SEAT"),
      { params: Promise.resolve({ path: ["rides", "..", "search"] }) } as never,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${GATEWAY_URL}/api/rides/search?kind=SEAT`,
      expect.objectContaining({ method: "GET" }),
    );
  });
});
