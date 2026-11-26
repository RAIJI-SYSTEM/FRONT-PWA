import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadMapbox(token?: string) {
  vi.resetModules();
  if (token === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  else process.env.NEXT_PUBLIC_MAPBOX_TOKEN = token;
  return import("@/services/mapbox");
}

const feature = (overrides: Record<string, unknown> = {}) => ({
  id: "f1",
  geometry: { coordinates: [-46.65, -23.56] },
  properties: {
    name: "Av. Paulista",
    feature_type: "address",
    place_formatted: "Av. Paulista, São Paulo - SP",
    context: { place: { name: "São Paulo" }, region: { name: "São Paulo", region_code: "sp" } },
  },
  ...overrides,
});

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
});

describe("sem token do Mapbox", () => {
  it("não busca nada e devolve fallbacks", async () => {
    const mapbox = await loadMapbox(undefined);
    expect(mapbox.MAPBOX_TOKEN).toBe("");
    await expect(mapbox.searchPlaces("Avenida Paulista")).resolves.toEqual([]);
    await expect(mapbox.reverseGeocode([-46.65, -23.56])).resolves.toMatchObject({ id: "-46.65,-23.56", name: "Local no mapa" });
    await expect(mapbox.getDrivingRoute([0, 0], [1, 1])).resolves.toBeNull();
  });
});

describe("com token do Mapbox", () => {
  it("busca endereços e monta os lugares", async () => {
    const mapbox = await loadMapbox("pk-teste");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({ features: [feature()] }) }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(mapbox.searchPlaces("ab")).resolves.toEqual([]); // curto demais

    const places = await mapbox.searchPlaces("Avenida Paulista", [-46.6, -23.5], undefined, "place");
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain("q=Avenida+Paulista");
    expect(url).toContain("country=br");
    expect(url).toContain("proximity=-46.6%2C-23.5");
    expect(url).toContain("types=place");
    expect(places[0]).toEqual({
      id: "f1",
      name: "Av. Paulista",
      address: "Av. Paulista, São Paulo - SP",
      city: "São Paulo",
      state: "SP",
      coordinates: [-46.65, -23.56],
    });
  });

  it("usa full_address e o nome como cidade quando não há context", async () => {
    const mapbox = await loadMapbox("pk");
    const props = { name: "Campinas", feature_type: "place", full_address: "Campinas - SP" };
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ features: [feature({ properties: props })] }) })));
    const [place] = await mapbox.searchPlaces("Campinas");
    expect(place).toMatchObject({ address: "Campinas - SP", city: "Campinas", state: undefined });
  });

  it("erro da API de busca vira Error", async () => {
    const mapbox = await loadMapbox("pk");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(mapbox.searchPlaces("Avenida Paulista")).rejects.toThrow("Falha ao buscar endereços.");
  });

  it("geocodificação reversa mantém a coordenada do pino", async () => {
    const mapbox = await loadMapbox("pk");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ features: [feature()] }) })));
    await expect(mapbox.reverseGeocode([-1, -2])).resolves.toMatchObject({ coordinates: [-1, -2], name: "Av. Paulista" });
  });

  it("geocodificação reversa usa fallback em erro ou sem resultados", async () => {
    const mapbox = await loadMapbox("pk");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(mapbox.reverseGeocode([1, 2])).resolves.toMatchObject({ name: "Local no mapa", coordinates: [1, 2] });

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ features: [] }) })));
    await expect(mapbox.reverseGeocode([3, 4])).resolves.toMatchObject({ name: "Local no mapa" });
  });

  it("traça a rota de carro", async () => {
    const mapbox = await loadMapbox("pk");
    const route = { geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] }, distance: 100, duration: 60 };
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({ routes: [route] }) }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(mapbox.getDrivingRoute([-46.6, -23.5], [-47, -22.9])).resolves.toEqual({
      geometry: route.geometry,
      distanceMeters: 100,
      durationSeconds: 60,
    });
    expect(fetchMock.mock.calls[0]![0]).toContain("/directions/v5/mapbox/driving/-46.6,-23.5;-47,-22.9");
  });

  it("rota sem resultado ou com erro devolve null", async () => {
    const mapbox = await loadMapbox("pk");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    await expect(mapbox.getDrivingRoute([0, 0], [1, 1])).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(mapbox.getDrivingRoute([0, 0], [1, 1])).resolves.toBeNull();
  });

  it("searchCities restringe a municípios", async () => {
    const mapbox = await loadMapbox("pk");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true, json: async () => ({ features: [] }) }));
    vi.stubGlobal("fetch", fetchMock);
    await mapbox.searchCities("Campinas");
    expect(fetchMock.mock.calls[0]![0]).toContain("types=place");
  });
});
