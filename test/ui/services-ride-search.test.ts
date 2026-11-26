import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
const publishOnBoard = vi.hoisted(() => vi.fn());

vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});
vi.mock("@/services/board", () => ({ publishOnBoard }));

import * as rs from "@/services/rideSearch";

const STORAGE_KEY = "raiji.rideSearches";

const place = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Av. Paulista",
  address: "1000",
  city: "São Paulo",
  state: "SP",
  coordinates: [-46.65, -23.56] as [number, number],
  ...overrides,
});

const result = (overrides: Record<string, unknown> = {}) => ({
  ride: {
    id: "r1",
    driverName: "Carlos",
    availableSeats: 2,
    meetingPoint: "Posto",
    originCity: "São Paulo",
    destinationCity: "Campinas",
    departureDate: "2099-01-01T08:00:00",
    pricePerPassenger: 50,
    pricePerPackage: 20,
    ...(overrides.ride as Record<string, unknown> | undefined),
  },
  pickupDistanceMeters: 100,
  dropoffDistanceMeters: 200,
  routeFraction: 0.5,
  fullRoute: true,
  suggestedPrice: 50,
  suggestedPackagePrice: 20,
  vehicle: "Onix",
  ...overrides,
});

const search = (overrides: Record<string, unknown> = {}) => ({
  id: "s1",
  origin: place(),
  destination: place(),
  departure: { type: "scheduled", at: "2099-01-01T08:00:00.000Z" },
  status: "results",
  intermunicipal: false,
  offers: [],
  createdAt: "2026-11-25T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  backendMock.mockReset();
  publishOnBoard.mockReset();
  sessionStorage.clear();
});

describe("searchWindow", () => {
  it("'agora' = próxima 1 hora", () => {
    const w = rs.searchWindow({ type: "now" });
    expect(w.from).toMatch(/T\d{2}:\d{2}:\d{2}$/);
    expect(new Date(w.to).getTime()).toBeGreaterThan(0);
  });

  it("agendada = 1 h antes até 4 h depois", () => {
    const at = new Date("2099-01-01T12:00:00.000Z");
    const w = rs.searchWindow({ type: "scheduled", at: at.toISOString() });
    expect(w.from).toContain("2099-01-01T08:00:00");
    expect(w.to).toContain("2099-01-01T13:00:00");
  });

  it("agendada no passado começa agora", () => {
    const w = rs.searchWindow({ type: "scheduled", at: "2000-01-01T00:00:00.000Z" });
    expect(w.from).toMatch(/T\d{2}:\d{2}:\d{2}$/);
  });
});

describe("toOffer", () => {
  it("monta a oferta de vaga e de encomenda", () => {
    const seat = rs.toOffer(result() as never);
    expect(seat).toMatchObject({ id: "r1", driverName: "Carlos", vehicle: "Onix", priceCents: 5000, seatsLeft: 2, routeLabel: "São Paulo → Campinas" });

    const pkg = rs.toOffer(result() as never, "package");
    expect(pkg.priceCents).toBe(2000);

    expect(
      rs.toOffer(
        result({ ride: { driverName: null, pricePerPassenger: 1, departureDate: "2000-01-01T00:00:00" }, vehicle: null }) as never,
      ),
    ).toMatchObject({
      driverName: "Motorista",
      vehicle: "",
      etaMinutes: 0,
    });
  });
});

describe("findRides / createRideSearch", () => {
  it("consulta o backend com os pontos e a janela", async () => {
    backendMock.mockResolvedValue([]);
    await rs.findRides(place() as never, place({ coordinates: [-47, -22.9] }) as never, { type: "now" }, "SEAT");

    const [path, init] = backendMock.mock.calls[0] as [string, { query: Record<string, unknown> }];
    expect(path).toBe("/api/rides/search");
    expect(init.query).toMatchObject({
      originLat: -23.56,
      originLng: -46.65,
      destinationLat: -22.9,
      destinationLng: -47,
      radiusMeters: 5000,
      kind: "SEAT",
    });
  });

  it("cria a busca, ordena ofertas por preço e guarda na sessão", async () => {
    backendMock.mockResolvedValue([
      result({ ride: { id: "caro", departureDate: "2099-01-01T08:00:00" }, suggestedPrice: 80 }),
      result({ ride: { id: "barato", departureDate: "2099-01-01T08:00:00" }, suggestedPrice: 30 }),
      result({ ride: { id: "empate", departureDate: "2099-01-01T09:00:00" }, suggestedPrice: 30 }),
    ]);

    const created = await rs.createRideSearch({
      origin: place({ city: "São Paulo" }) as never,
      destination: place({ city: "Campinas" }) as never,
      departure: { type: "now" },
    });

    expect(created.status).toBe("results");
    expect(created.intermunicipal).toBe(true);
    expect(created.offers.map((o) => o.id)).toEqual(["barato", "empate", "caro"]);
    expect(created.id).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)[created.id]).toBeTruthy();
  });

  it("sem ofertas, status no_results", async () => {
    backendMock.mockResolvedValue([]);
    const created = await rs.createRideSearch({ origin: place() as never, destination: place() as never, departure: { type: "now" } });
    expect(created.status).toBe("no_results");
    expect(created.intermunicipal).toBe(false);
  });

  it("tolera sessionStorage corrompido", async () => {
    sessionStorage.setItem(STORAGE_KEY, "{quebrado");
    backendMock.mockResolvedValue([]);
    await expect(rs.createRideSearch({ origin: place() as never, destination: place() as never, departure: { type: "now" } })).resolves.toBeTruthy();
  });
});

describe("busca guardada", () => {
  beforeEach(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ s1: { search: search(), results: [result()] } }));
  });

  it("lê, acha o resultado e cancela", async () => {
    await expect(rs.getRideSearch("s1")).resolves.toMatchObject({ id: "s1" });
    expect(rs.getSearchResult("s1", "r1")?.result.ride.id).toBe("r1");
    expect(rs.getSearchResult("s1", "outro")).toBeNull();
    expect(rs.getSearchResult("nao-existe", "r1")).toBeNull();

    const canceled = await rs.cancelRideSearch("s1");
    expect(canceled.status).toBe("canceled");
  });

  it("publica no mural quando é agendada", async () => {
    publishOnBoard.mockResolvedValue({ id: "board-1" });
    const request = await rs.publishRideSearch("s1");
    expect(request).toEqual({ id: "board-1" });
    expect(publishOnBoard).toHaveBeenCalledWith(expect.objectContaining({ kind: "SEAT", at: "2099-01-01T08:00:00.000Z" }));
    expect((await rs.getRideSearch("s1")).status).toBe("published");
  });

  it("não publica busca 'agora'", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ s1: { search: search({ departure: { type: "now" } }), results: [] } }));
    await expect(rs.publishRideSearch("s1")).rejects.toMatchObject({ status: 400 });
  });

  it("erros para busca inexistente", async () => {
    await expect(rs.publishRideSearch("x")).rejects.toMatchObject({ status: 404 });
    await expect(rs.getRideSearch("x")).rejects.toMatchObject({ status: 404 });
    await expect(rs.cancelRideSearch("x")).rejects.toMatchObject({ status: 404 });
  });
});

describe("prepareDirectRequest", () => {
  it("monta o pedido da viagem inteira e devolve o link", () => {
    const link = rs.prepareDirectRequest({
      id: "r9",
      originCity: "São Paulo",
      originState: "SP",
      originAddress: null,
      originLatitude: -23.5,
      originLongitude: -46.6,
      destinationCity: "Campinas",
      destinationState: "SP",
      destinationAddress: "Rua B",
      destinationLatitude: null,
      destinationLongitude: null,
      departureDate: "2099-01-01T08:00:00",
      pricePerPassenger: 50,
      pricePerPackage: 20,
    } as never);

    expect(link).toContain("/viagem/pedido?busca=");
    const id = new URL(`http://x${link}`).searchParams.get("busca")!;
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)[id];
    expect(stored.search).toMatchObject({ status: "results", intermunicipal: true });
    expect(stored.search.origin).toMatchObject({ address: "São Paulo/SP", coordinates: [-46.6, -23.5] });
    expect(stored.search.destination).toMatchObject({ address: "Rua B", coordinates: [0, 0] });
    expect(stored.results[0]).toMatchObject({ fullRoute: true, suggestedPrice: 50 });
  });
});
