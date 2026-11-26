import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * [Mutação] Testes adicionais para matarem mutantes sobreviventes do Stryker
 * nos serviços do FRONT-PWA. São testes de comportamento, não de implementação.
 */
const state = vi.hoisted(() => ({ token: "token-123" as string | null }));
vi.mock("@/services/auth", () => ({ getAccessToken: vi.fn(async () => state.token) }));

import { backend, fromBrazilLocal, toBrazilLocal, toCents } from "@/services/backend/client";
import { publishOnBoard } from "@/services/board";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  state.token = "token-123";
});

describe("[Mutação] backend", () => {
  it("sem token usa mensagem clara de login", async () => {
    state.token = null;
    await expect(backend("/api/rides")).rejects.toMatchObject({
      status: 401,
      message: "Entre na sua conta para continuar.",
    });
  });

  it("sem init usa GET, não envia corpo e não define Content-Type", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/api/rides");

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("no navegador usa a origem da janela como base da URL", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/api/rides");

    expect(fetchMock.mock.calls[0]![0]).toBe(`${window.location.origin}/api/raiji/rides`);
  });

  it("ignora query undefined e null", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await backend("/api/rides", { query: { status: "PLANNED", skip: null, undef: undefined } });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("status=PLANNED");
    expect(url).not.toContain("skip");
    expect(url).not.toContain("undef");
  });

  it("resposta 200 com JSON inválido vira null", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{invalido", { status: 200 })));

    await expect(backend("/api/rides")).resolves.toBeNull();
  });

  it("toCents aceita undefined", () => {
    expect(toCents(undefined)).toBe(0);
  });
});

describe("[Mutação] toBrazilLocal", () => {
  it("aceita Date, não apenas string", () => {
    expect(toBrazilLocal(new Date("2026-11-20T11:00:00Z"))).toBe("2026-11-20T08:00:00");
  });

  it("trata hora 24 como 00", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue([
      { type: "year", value: "2026" },
      { type: "month", value: "11" },
      { type: "day", value: "20" },
      { type: "hour", value: "24" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
    ] as Intl.DateTimeFormatPart[]);

    expect(toBrazilLocal(new Date())).toBe("2026-11-20T00:00:00");
  });

  it("usa 00 quando o Intl não devolve uma parte", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockReturnValue([
      { type: "year", value: "2026" },
      { type: "month", value: "11" },
      { type: "day", value: "20" },
      { type: "minute", value: "00" },
      { type: "second", value: "00" },
    ] as Intl.DateTimeFormatPart[]);

    expect(toBrazilLocal(new Date())).toBe("2026-11-20T00:00:00");
  });

  it("fromBrazilLocal mantém o instante com fuso", () => {
    expect(fromBrazilLocal("2026-11-20T08:00:00")).toBe("2026-11-20T11:00:00.000Z");
    // O backend manda hora de parede sem fração; se vier fração, é descartada.
    expect(fromBrazilLocal("2026-11-20T08:00:00.123")).toBe("2026-11-20T11:00:00.000Z");
  });
});

describe("[Mutação] board", () => {
  const place = (overrides: Record<string, unknown> = {}) => ({
    id: "p1",
    name: "Av. Paulista",
    address: "1000",
    city: "São Paulo",
    state: "SP",
    coordinates: [-46.65, -23.56] as [number, number],
    ...overrides,
  });

  it("usa POST e trunca o endereço em 255 caracteres", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => json({ id: "b1" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await publishOnBoard({
      kind: "SEAT",
      origin: place({ address: "x".repeat(400) }),
      destination: place(),
      at: "2026-12-01T10:00:00Z",
    });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as { origin: { address: string } };
    expect(body.origin.address).toHaveLength(255);
  });
});
