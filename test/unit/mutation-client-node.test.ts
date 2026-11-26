// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Testes que matam mutantes do cliente HTTP no contexto de servidor (Node).
 * O Vitest padrão do projeto roda no jsdom; aqui precisamos de `window`
 * indefinido para cobrir o fallback `http://localhost` do BFF.
 */
const state = vi.hoisted(() => ({ token: "token-123" as string | null }));
vi.mock("@/services/auth", () => ({ getAccessToken: vi.fn(async () => state.token) }));

import { backend } from "@/services/backend/client";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  state.token = "token-123";
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe("[Mutação] backend no servidor", () => {
  it("usa http://localhost como base quando não há window", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/api/rides");

    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost/api/raiji/rides");
  });

  it("remove apenas o prefixo /api, não /api no meio do caminho", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/x/api/bar");

    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost/api/raiji/x/api/bar");
  });
});

describe("[Mutação] apiUrl com NEXT_PUBLIC_API_URL", () => {
  it("remove a barra final da URL configurada e só prefixa caminhos absolutos", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example/";
    vi.resetModules();
    const { apiUrl } = await import("@/services/api");

    expect(apiUrl("/api/rides")).toBe("http://api.example/api/rides");
    expect(apiUrl("relativo")).toBe("relativo");
  });
});
