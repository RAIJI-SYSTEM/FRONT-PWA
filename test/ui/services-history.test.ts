import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});

import { listDeliveries, listRides, rateDriver, toDeliveryHistory } from "@/services/history";

const RATINGS_KEY = "raiji.driverRatings";

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: "b1",
  status: "CONFIRMED",
  pickupAddress: null,
  dropoffAddress: null,
  price: 23.8,
  paymentStatus: "PAID",
  baggage: [{ type: "mala", quantity: 1, lengthCm: 70, widthCm: 45, heightCm: 30, weightKg: 15 }],
  pendingBaggage: [],
  fullRoute: true,
  ...overrides,
});

const ride = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  status: "PLANNED",
  originCity: "São Paulo",
  originState: "SP",
  destinationCity: "Campinas",
  destinationState: "SP",
  departureDate: "2026-11-20T08:00:00",
  routeDistanceMeters: 100_000,
  totalSeats: 3,
  driverSub: "d1",
  driverName: "Carlos",
  meetingPoint: "Posto Shell",
  ...overrides,
});

const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: "d1",
  status: "DELIVERED",
  deliveryKeyword: "SOL-42",
  pickupAddress: "Rua A",
  dropoffAddress: "Rua B",
  ride: ride(),
  requestedAt: "2026-11-19T10:00:00.000Z",
  price: 15,
  size: "MEDIUM",
  description: "Caixa",
  fragile: true,
  recipientName: "Bia",
  pickupCode: "1234",
  companyId: null,
  paymentStatus: "PAID",
  ...overrides,
});

beforeEach(() => {
  backendMock.mockReset();
  localStorage.clear();
});

describe("listRides", () => {
  it("converte reservas em itens de histórico (com todos os status)", async () => {
    backendMock.mockResolvedValue([
      { booking: booking({ id: "b-cancel", status: "CANCELLED" }), ride: ride() },
      { booking: booking({ id: "b-ride-cancel", status: "CONFIRMED" }), ride: ride({ id: "r2", status: "CANCELLED" }) },
      { booking: booking({ id: "b-done", status: "COMPLETED" }), ride: ride({ id: "r3", status: "COMPLETED" }) },
      { booking: booking({ id: "b-conf-done", status: "CONFIRMED" }), ride: ride({ id: "r4", status: "COMPLETED" }) },
      { booking: booking({ id: "b-pending", status: "PENDING" }), ride: ride({ id: "r5" }) },
      { booking: booking({ id: "b-progress", status: "CONFIRMED", pendingBaggage: [{ type: "caixa", quantity: 1 }] }), ride: ride({ id: "r6", status: "IN_PROGRESS" }) },
      { booking: booking({ id: "b-sched", status: "CONFIRMED", pickupAddress: "Portão 2", dropoffAddress: "Centro" }), ride: ride({ id: "r7" }) },
    ]);

    const items = await listRides();
    expect(items.map((i) => i.status)).toEqual([
      "canceled",
      "canceled",
      "completed",
      "completed",
      "requested",
      "in_progress",
      "scheduled",
    ]);
    expect(items[0]).toMatchObject({
      origin: "São Paulo/SP",
      destination: "Campinas/SP",
      priceCents: 2380,
      distanceKm: 100,
      shared: true,
      driver: { id: "d1", name: "Carlos" },
      baggageSummary: "1× mala",
      baggagePending: false,
      meetingPoint: "Posto Shell",
    });
    expect(items[5]!.baggagePending).toBe(true);
    expect(items[6]!.origin).toBe("Portão 2");
  });

  it("inclui avaliações salvas no aparelho e tolera storage corrompido", async () => {
    localStorage.setItem(RATINGS_KEY, "{quebrado");
    backendMock.mockResolvedValue([{ booking: booking(), ride: ride() }]);
    expect((await listRides())[0]!.rating).toBeUndefined();

    localStorage.setItem(RATINGS_KEY, JSON.stringify({ "rides:b1": { stars: 5, tags: ["Pontual"], ratedAt: "2026-01-01" } }));
    expect((await listRides())[0]!.rating?.stars).toBe(5);
  });
});

describe("listDeliveries / toDeliveryHistory", () => {
  it("converte todos os status de encomenda", async () => {
    backendMock.mockResolvedValue([
      delivery({ id: "d-pending", status: "PENDING" }),
      delivery({ id: "d-confirmed", status: "CONFIRMED" }),
      delivery({ id: "d-transit", status: "IN_TRANSIT" }),
      delivery({ id: "d-delivered", status: "DELIVERED" }),
      delivery({ id: "d-cancelled", status: "CANCELLED" }),
    ]);
    const items = await listDeliveries();
    expect(items.map((i) => i.status)).toEqual(["requested", "awaiting_pickup", "in_transit", "delivered", "canceled"]);
    expect(items[0]).toMatchObject({ code: "SOL-42", size: "medium", priceCents: 1500, keyword: "SOL-42" });
  });

  it("usa o id como código e trata encomenda sem carona", () => {
    const item = toDeliveryHistory(delivery({ deliveryKeyword: null, id: "abcdef123456", ride: null }) as never);
    expect(item.code).toBe("ABCDEF12");
    expect(item.date).toBe("2026-11-19T10:00:00.000Z");
    expect(item.origin).toBe("Rua A");
    expect(item.driver).toEqual({ id: "", name: "Motorista", vehicle: "" });
  });

  it("aplica avaliação salva", async () => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify({ "deliveries:d1": { stars: 4, tags: [], ratedAt: "x" } }));
    backendMock.mockResolvedValue([delivery()]);
    expect((await listDeliveries())[0]!.rating?.stars).toBe(4);
  });
});

describe("rateDriver", () => {
  it("grava a avaliação e devolve o item atualizado", async () => {
    backendMock.mockResolvedValue([{ booking: booking(), ride: ride() }]);
    const item = await rateDriver("rides", "b1", { stars: 5, tags: ["Pontual"], comment: "Ótimo" });

    expect(item.rating).toMatchObject({ stars: 5, tags: ["Pontual"], comment: "Ótimo" });
    expect(JSON.parse(localStorage.getItem(RATINGS_KEY)!)).toMatchObject({
      "rides:b1": { stars: 5, comment: "Ótimo" },
    });
  });

  it("funciona para encomendas", async () => {
    backendMock.mockResolvedValue([delivery()]);
    const item = await rateDriver("deliveries", "d1", { stars: 3 });
    expect(item.rating).toMatchObject({ stars: 3, tags: [] });
  });

  it("tolera falha ao gravar no localStorage", async () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    backendMock.mockResolvedValue([{ booking: booking(), ride: ride() }]);
    await expect(rateDriver("rides", "b1", { stars: 4 })).resolves.toBeDefined();
    spy.mockRestore();
  });
});
