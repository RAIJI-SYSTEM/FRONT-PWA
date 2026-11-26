import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ token: "token-123" as string | null }));
vi.mock("@/services/auth", () => ({ getAccessToken: vi.fn(async () => state.token) }));

import { ApiError, apiFetch, apiUrl } from "@/services/api";
import { backend, fromBrazilLocal, toBrazilLocal, toCents, toReais } from "@/services/backend/client";
import { chat } from "@/services/chat";

const response = (body: unknown, init: { status?: number; ok?: boolean; text?: string } = {}) => ({
  ok: init.ok ?? (init.status ?? 200) < 400,
  status: init.status ?? 200,
  json: async () => {
    if (typeof init.text === "string") return JSON.parse(init.text);
    return body;
  },
  text: async () => (typeof init.text === "string" ? init.text : JSON.stringify(body)),
  headers: new Headers(),
});

beforeEach(() => {
  vi.unstubAllGlobals();
  state.token = "token-123";
});

describe("api", () => {
  it("apiUrl mantém caminhos absolutos", () => {
    expect(apiUrl("/api/x")).toBe("/api/x");
    expect(apiUrl("https://outro/x")).toBe("https://outro/x");
  });

  it("apiFetch envia JSON e devolve o corpo", async () => {
    const fetchMock = vi.fn(async () => response({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch<{ ok: boolean }>("/api/x", { method: "POST", body: "{}" })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/x",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "Content-Type": "application/json" }) }),
    );
  });

  it("apiFetch vira ApiError com mensagem e erros por campo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ error: "Placa inválida", fields: { plate: "x" } }, { status: 400 })),
    );
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Placa inválida", status: 400, fields: { plate: "x" } });
  });

  it("apiFetch usa mensagem padrão quando o corpo não é JSON", async () => {
    const bad = { ok: false, status: 500, json: async () => Promise.reject(new Error("html")) };
    vi.stubGlobal("fetch", vi.fn(async () => bad));
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ message: "Erro inesperado. Tente novamente.", status: 500 });
  });
});

describe("backend client", () => {
  it("exige login", async () => {
    state.token = null;
    await expect(backend("/api/x")).rejects.toMatchObject({ status: 401 });
    expect(state.token).toBeNull();
  });

  it("monta URL, query (com listas e nulos) e cabeçalhos", async () => {
    const fetchMock = vi.fn(async () => response({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/api/rides", {
      method: "POST",
      body: { a: 1 },
      query: { status: ["PLANNED", "COMPLETED"], size: 50, skip: null, undef: undefined },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/raiji/rides?");
    expect(url).toContain("status=PLANNED");
    expect(url).toContain("status=COMPLETED");
    expect(url).toContain("size=50");
    expect(url).not.toContain("skip");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token-123");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("envia FormData sem Content-Type manual", async () => {
    const fetchMock = vi.fn(async () => response({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("x", "1");

    await backend("/api/upload", { method: "POST", body: form });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("204 devolve undefined", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 204, text: async () => "" })));
    await expect(backend("/api/x")).resolves.toBeUndefined();
  });

  it("corpo vazio devolve null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => "" })));
    await expect(backend("/api/x")).resolves.toBeNull();
  });

  it("usa mensagens padrão por status quando o servidor não manda mensagem", async () => {
    for (const [status, message] of [
      [401, "Sua sessão expirou. Entre de novo."],
      [403, "Você não tem permissão para isso."],
      [404, "Não encontrado."],
      [500, "O servidor está com problemas. Tente de novo em instantes."],
      [418, "Erro inesperado. Tente novamente."],
    ] as [number, string][]) {
      vi.stubGlobal("fetch", vi.fn(async () => response({}, { status })));
      await expect(backend("/api/x")).rejects.toMatchObject({ message, status });
    }
  });

  it("prefere a mensagem do servidor e aceita corpo não-JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ message: "Deu ruim" }, { status: 422 })));
    await expect(backend("/api/x")).rejects.toMatchObject({ message: "Deu ruim", status: 422 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400, text: async () => "texto puro" })),
    );
    await expect(backend("/api/x")).rejects.toMatchObject({ status: 400 });
  });

  it("converte reais/centavos e horário de Brasília", () => {
    expect(toCents(12.345)).toBe(1235);
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toReais(1235)).toBe(12.35);
    expect(toReais(null)).toBeNull();
    expect(toReais(undefined)).toBeNull();

    expect(toBrazilLocal("2026-11-20T11:00:00Z")).toBe("2026-11-20T08:00:00");
    expect(toBrazilLocal(new Date("2026-11-20T11:00:00Z"))).toBe("2026-11-20T08:00:00");
    expect(fromBrazilLocal("2026-11-20T08:00:00")).toBe("2026-11-20T11:00:00.000Z");
    expect(fromBrazilLocal(null)).toMatch(/Z$/);
    expect(fromBrazilLocal(undefined)).toMatch(/Z$/);
  });
});

describe("chat client", () => {
  it("exige login", async () => {
    state.token = null;
    await expect(chat("/conversations")).rejects.toMatchObject({ status: 401 });
  });

  it("chama /api/chat com o token", async () => {
    const fetchMock = vi.fn(async () => response([{ id: "c1" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(chat("/conversations")).resolves.toEqual([{ id: "c1" }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat/conversations",
      expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: "Bearer token-123" }) }),
    );
  });

  it("204 devolve undefined", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 204, json: async () => null })));
    await expect(chat("/x")).resolves.toBeUndefined();
  });

  it("traduz os códigos de erro do chat", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ error: "file_too_large" }, { status: 413 })));
    await expect(chat("/x")).rejects.toMatchObject({ message: "Arquivo maior que 10 MB.", status: 413 });
  });

  it("erros de indisponibilidade e genéricos", async () => {
    for (const status of [502, 503]) {
      vi.stubGlobal("fetch", vi.fn(async () => response({}, { status })));
      await expect(chat("/x")).rejects.toMatchObject({ message: "O chat está fora do ar. Tente de novo em instantes." });
    }
    vi.stubGlobal("fetch", vi.fn(async () => response({ error: "desconhecido" }, { status: 400 })));
    await expect(chat("/x")).rejects.toMatchObject({ message: "Não foi possível concluir. Tente de novo." });
  });

  it("sem conexão vira ApiError 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(chat("/x")).rejects.toMatchObject({ status: 0, message: "Sem conexão com o chat. Confira a internet." });
  });
});
