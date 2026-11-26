import { beforeEach, describe, expect, it, vi } from "vitest";

import { GATEWAY_URL, forwardToGateway, joinSegments } from "@/server/gateway";
import { modeFromRequest } from "@/server/modeParam";
import {
  getPreferences,
  listNotifications,
  markRead,
  removeNotification,
  updatePreferences,
} from "@/server/notifications";

beforeEach(() => vi.unstubAllGlobals());

describe("gateway (BFF -> Kong)", () => {
  it("repete o caminho com segurança", () => {
    expect(joinSegments(["rides", "", ".", "..", "r1", "requests"])).toBe("rides/r1/requests");
    expect(joinSegments(["a b", "c/d"])).toBe("a%20b/c%2Fd");
  });

  it("repassa método, cabeçalhos permitidos, corpo e query", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("ok", { status: 201, headers: { "content-type": "application/json", "x-ignorado": "1" } }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://app.local/api/raiji/rides?x=1", {
      method: "POST",
      headers: { authorization: "Bearer t", "content-type": "application/json", cookie: "a=1", origin: "http://app.local" },
      body: JSON.stringify({ a: 1 }),
    });

    const response = await forwardToGateway(request, "rides");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${GATEWAY_URL}rides?x=1`);
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("manual");
    expect(init.cache).toBe("no-store");
    expect((init.headers as Headers).get("authorization")).toBe("Bearer t");
    expect((init.headers as Headers).get("cookie")).toBeNull();
    expect((init.headers as Headers).get("origin")).toBeNull();
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"a":1}');

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("x-ignorado")).toBeNull();
  });

  it("GET/HEAD não enviam corpo e 204 responde sem corpo", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardToGateway(new Request("http://app.local/api/raiji/rides", { method: "GET" }), "rides");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).body).toBeUndefined();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("304 também responde sem corpo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 304 })));
    const response = await forwardToGateway(new Request("http://app.local/x"), "x");
    expect(response.status).toBe(304);
  });

  it("Kong fora do ar vira 502 com mensagem amigável", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));
    const response = await forwardToGateway(new Request("http://app.local/api/raiji/rides"), "rides");
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ message: expect.stringContaining("fora do ar") });
  });
});

describe("modeParam", () => {
  it("lê ?modo=motorista", () => {
    expect(modeFromRequest(new Request("http://x/?modo=motorista"))).toBe("driver");
    expect(modeFromRequest(new Request("http://x/?modo=passageiro"))).toBe("passenger");
    expect(modeFromRequest(new Request("http://x/"))).toBe("passenger");
  });
});

describe("notificações simuladas do servidor", () => {
  it("lista por modo respeitando as preferências (account sempre aparece)", () => {
    const passenger = listNotifications("passenger");
    expect(passenger.length).toBeGreaterThan(0);
    expect(passenger.every((n) => n.mode === "passenger")).toBe(true);
    expect(passenger.some((n) => n.category === "promotions")).toBe(true);
    expect(passenger.some((n) => n.category === "account")).toBe(true);
    expect(passenger.map((n) => n.createdAt)).toEqual([...passenger.map((n) => n.createdAt)].sort().reverse());
  });

  it("motorista não vê promoções (preferência desligada)", () => {
    const driver = listNotifications("driver");
    expect(driver.length).toBeGreaterThan(0);
    expect(driver.some((n) => n.category === "promotions")).toBe(false);
  });

  it("marca por id, marca todas e remove", () => {
    const one = markRead("passenger", ["p1"]);
    expect(one.find((n) => n.id === "p1")?.read).toBe(true);
    expect(one.find((n) => n.id === "p2")?.read).toBe(false);

    expect(markRead("passenger").every((n) => n.read)).toBe(true);

    expect(removeNotification("passenger", "p2")).toBe(true);
    expect(removeNotification("passenger", "p2")).toBe(false);
    expect(listNotifications("passenger").some((n) => n.id === "p2")).toBe(false);
    expect(removeNotification("driver", "p1")).toBe(false);
  });

  it("preferências: lê e atualiza só chaves booleanas conhecidas", () => {
    expect(getPreferences("driver")).toMatchObject({ promotions: false });
    const updated = updatePreferences("driver", { promotions: true, trips: "sim" as never, desconhecida: true } as never);
    expect(updated.promotions).toBe(true);
    expect(updated.trips).toBe(true);
    expect((updated as Record<string, unknown>).desconhecida).toBeUndefined();
  });
});
