import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});

import * as drivers from "@/services/drivers";
import * as rides from "@/services/rides";
import * as board from "@/services/board";
import * as companies from "@/services/companies";
import * as payouts from "@/services/payouts";
import * as profile from "@/services/profile";
import * as rewards from "@/services/rewards";
import * as payments from "@/services/payments";

beforeEach(() => backendMock.mockReset());

const ride = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  visibility: "PUBLIC",
  bookingsClosed: false,
  departureDate: "2099-01-01T08:00:00",
  ...overrides,
});

describe("profile / rewards / payments", () => {
  it("chama os endpoints certos", async () => {
    backendMock.mockResolvedValue({ ok: true });
    await profile.getMe();
    await profile.getContact();
    await profile.updatePhone("+5511912345678");
    expect(backendMock.mock.calls).toEqual([
      ["/api/users/me"],
      ["/api/users/me/contact"],
      ["/api/users/me", { method: "PATCH", body: { phone: "+5511912345678" } }],
    ]);

    backendMock.mockClear();
    await rewards.getRewards();
    await rewards.creditMockAd("coupon", "tx-1");
    expect(backendMock.mock.calls).toEqual([
      ["/api/rewards"],
      ["/api/rewards/ad-watched", { method: "POST", body: { kind: "coupon", transactionId: "tx-1" } }],
    ]);

    backendMock.mockClear();
    const rideTarget = { kind: "ride" as const, rideId: "r1", requestId: "req1" };
    const deliveryTarget = { kind: "delivery" as const, deliveryId: "d1" };
    await payments.startPayment(rideTarget);
    await payments.startPayment(deliveryTarget, "cupom");
    await payments.getPayment(rideTarget);
    expect(backendMock.mock.calls).toEqual([
      ["/api/rides/r1/requests/req1/payment", { method: "POST" }],
      ["/api/deliveries/d1/payment", { method: "POST", body: { coupon: "cupom" } }],
      ["/api/rides/r1/requests/req1/payment"],
    ]);
  });
});

describe("rides", () => {
  it("pedidos, listagem, detalhe, bagagem, cancelamento e prévia", async () => {
    backendMock.mockResolvedValue({ ok: true });
    await rides.requestSeat("r1", { passengerName: "Ana", baggage: [] });
    await rides.listMyBookings();
    await rides.getRide("r1");
    await rides.updateBaggage("r1", "req1", []);
    await rides.cancelBooking("r1", "req1");
    await rides.cancelBooking("r1", "req1", "desisti");
    await rides.previewPrice(100);

    expect(backendMock.mock.calls).toEqual([
      ["/api/rides/r1/requests", { method: "POST", body: { passengerName: "Ana", baggage: [] } }],
      ["/api/rides/bookings/mine"],
      ["/api/rides/r1"],
      ["/api/rides/r1/requests/req1/baggage", { method: "PUT", body: { baggage: [] } }],
      ["/api/rides/r1/requests/req1", { method: "DELETE", body: { reason: null } }],
      ["/api/rides/r1/requests/req1", { method: "DELETE", body: { reason: "desisti" } }],
      ["/api/rides/price-preview", { query: { price: 100 } }],
    ]);
  });
});

describe("drivers", () => {
  it("busca viagens abertas por cidade/dia", async () => {
    backendMock.mockResolvedValue({ content: [ride(), ride({ id: "r2", visibility: "PRIVATE" }), ride({ id: "r3", bookingsClosed: true }), ride({ id: "r4", departureDate: "2000-01-01T08:00:00" })] });
    const result = await drivers.searchTrips("São Paulo", "Campinas", "2026-12-01");
    expect(result.map((r) => r.id)).toEqual(["r1"]);

    const [url, init] = backendMock.mock.calls[0] as [string, { query: Record<string, unknown> }];
    expect(url).toBe("/api/rides");
    expect(init.query).toMatchObject({ originCity: "São Paulo", destinationCity: "Campinas", size: 50 });
    expect(String(init.query.departureFrom)).toContain("2026-12-01T00:00:00");
    expect(String(init.query.departureTo)).toContain("2026-12-01T23:59:59");
  });

  it("busca sem destino nem data", async () => {
    backendMock.mockResolvedValue({ content: [] });
    await drivers.searchTrips("São Paulo");
    const [, init] = backendMock.mock.calls[0] as [string, { query: Record<string, unknown> }];
    expect(init.query.destinationCity).toBeUndefined();
    expect(init.query.departureTo).toBeUndefined();
  });

  it("acha motorista pelo código e filtra viagens fechadas", async () => {
    backendMock.mockResolvedValue({ driverSub: "d1", driverName: "Carlos", code: "12345678", rides: [ride(), ride({ id: "x", bookingsClosed: true })] });
    const found = await drivers.findDriverByCode("12345678");
    expect(found.rides.map((r) => r.id)).toEqual(["r1"]);
    expect(backendMock).toHaveBeenCalledWith("/api/rides/drivers/by-code/12345678");
  });

  it("devolve o código do motorista", async () => {
    backendMock.mockResolvedValue({ code: "87654321" });
    await expect(drivers.getMyDriverCode()).resolves.toEqual({ code: "87654321" });
  });
});

describe("board", () => {
  const place = (overrides: Record<string, unknown> = {}) => ({
    id: "p1",
    name: "Av. Paulista",
    address: "1000",
    city: "São Paulo",
    state: "SP",
    coordinates: [-46.65, -23.56] as [number, number],
    ...overrides,
  });

  it("publica pedido convertendo lugares e detalhes", async () => {
    backendMock.mockResolvedValue({ id: "b1" });
    await board.publishOnBoard({
      kind: "PACKAGE",
      origin: place(),
      destination: place({ id: "p2", name: "Campinas", city: undefined, state: undefined, address: undefined }),
      at: "2026-12-01T10:00:00Z",
      details: {
        size: "medium",
        description: "Caixa",
        weightKg: 2,
        fragile: true,
        declaredValueCents: 5000,
        recipientName: "Bia",
        recipientPhone: "+5511999999999",
        notes: "Cuidado",
      } as never,
      companyId: "c1",
    });

    const body = (backendMock.mock.calls[0]![1] as { body: Record<string, unknown> }).body;
    expect(backendMock.mock.calls[0]![0]).toBe("/api/board");
    expect(body).toMatchObject({ kind: "PACKAGE", companyId: "c1", notes: "Cuidado" });
    expect(body.origin).toMatchObject({ city: "São Paulo", state: "SP", latitude: -23.56, longitude: -46.65 });
    expect(body.destination).toMatchObject({ city: "Campinas", state: "SP" });
    expect(body.pkg).toMatchObject({ size: "MEDIUM", declaredValue: 50, fragile: true });
  });

  it("publica sem detalhes e sem empresa", async () => {
    backendMock.mockResolvedValue({ id: "b2" });
    await board.publishOnBoard({ kind: "SEAT", origin: place(), destination: place(), at: "2026-12-01T10:00:00Z" });
    expect((backendMock.mock.calls[0]![1] as { body: Record<string, unknown> }).body).toMatchObject({ pkg: undefined, companyId: null, notes: null });
  });

  it("chama todas as rotas do mural", async () => {
    backendMock.mockResolvedValue({});
    await board.listMyBoard();
    await board.getBoard("b1");
    await board.listBoardOffers("b1");
    await board.acceptBoardOffer("b1", "o1");
    await board.cancelBoard("b1");
    await board.listBoardRegion({ lat: 1, lng: 2 });
    await board.listBoardRegion(null);
    await board.listBoardOffered();
    await board.offerOnBoard("b1", { price: 10 });
    await board.withdrawBoardOffer("b1", "o1");

    expect(backendMock.mock.calls).toEqual([
      ["/api/board/mine"],
      ["/api/board/b1"],
      ["/api/board/b1/offers"],
      ["/api/board/b1/offers/o1/accept", { method: "POST" }],
      ["/api/board/b1/cancel", { method: "POST" }],
      ["/api/board/region", { query: { lat: 1, lng: 2 } }],
      ["/api/board/region", { query: { lat: undefined, lng: undefined } }],
      ["/api/board/offered"],
      ["/api/board/b1/offers", { method: "POST", body: { price: 10 } }],
      ["/api/board/b1/offers/o1", { method: "DELETE" }],
    ]);
  });
});

describe("companies", () => {
  it("rotas de empresa, convites e frete", async () => {
    backendMock.mockResolvedValue({});
    await companies.previewCnpj("12.345.678/0001-90");
    await companies.registerCompany("12345678000190");
    await companies.listMyCompanies();
    await companies.getCompany("c1");
    await companies.inviteMember("c1", "a@b.c", "Ana");
    await companies.removeMember("c1", "m1");
    await companies.listMyInvites();
    await companies.acceptInvite("m1");
    await companies.declineInvite("m1");

    expect(backendMock.mock.calls[0]).toEqual(["/api/companies/cnpj/12345678000190"]);
    expect(backendMock.mock.calls[1]).toEqual(["/api/companies", { method: "POST", body: { cnpj: "12345678000190" } }]);
    expect(backendMock.mock.calls[4]).toEqual(["/api/companies/c1/members", { method: "POST", body: { email: "a@b.c", name: "Ana" } }]);
    expect(backendMock.mock.calls[6]).toEqual(["/api/companies/invites"]);
    expect(backendMock.mock.calls[7]).toEqual(["/api/companies/invites/m1/accept", { method: "POST" }]);

    backendMock.mockClear();
    await companies.createFreight("c1", {
      origin: { city: "SP", state: "SP", latitude: 1, longitude: 2 },
      destination: { city: "RJ", state: "RJ", latitude: 3, longitude: 4 },
      desiredDate: new Date("2026-12-01T10:00:00Z"),
      pkg: { size: "MEDIUM", description: "Caixa", weightKg: 2, fragile: false, recipientName: "Bia", recipientPhone: "+55" },
    });
    expect((backendMock.mock.calls[0]![1] as { body: Record<string, unknown> }).body.desiredDate).toBe("2026-12-01T07:00:00");

    await companies.listCompanyFreights("c1");
    await companies.getFreight("f1");
    await companies.listFreightOffers("f1");
    await companies.acceptFreightOffer("f1", "o1");
    await companies.cancelFreight("f1");
    await companies.listFreightsForMe();
    await companies.listFreightsNearby(1, 2);
    await companies.listFreightsNearby(1, 2, 1000);
    await companies.acceptDirectFreight("f1", "v1");
    await companies.declineDirectFreight("f1");
    await companies.declineDirectFreight("f1", "sem espaço");
    await companies.offerOnFreight("f1", 10, "v1", "oi");
    await companies.withdrawFreightOffer("f1", "o1");

    const paths = backendMock.mock.calls.map((c) => c[0]);
    expect(paths).toEqual([
      "/api/companies/c1/freight-requests",
      "/api/companies/c1/freight-requests",
      "/api/freight-requests/f1",
      "/api/freight-requests/f1/offers",
      "/api/freight-requests/f1/offers/o1/accept",
      "/api/freight-requests/f1/cancel",
      "/api/freight-requests/for-me",
      "/api/freight-requests/nearby",
      "/api/freight-requests/nearby",
      "/api/freight-requests/f1/accept",
      "/api/freight-requests/f1/decline",
      "/api/freight-requests/f1/decline",
      "/api/freight-requests/f1/offers",
      "/api/freight-requests/f1/offers/o1",
    ]);
    expect(backendMock.mock.calls[8]![1]).toEqual({ query: { lat: 1, lng: 2, radiusMeters: 1000 } });
  });
});

describe("payouts", () => {
  it("chama as rotas do motorista e do admin", async () => {
    backendMock.mockResolvedValue({});
    await payouts.getMyPayouts();
    await payouts.savePixKey("pix@x");
    await payouts.getPayoutBalances();
    await payouts.getPayoutHistory();
    await payouts.registerPayout("d1", 1000);
    await payouts.registerPayout("d1", 1000, "obs");

    expect(backendMock.mock.calls).toEqual([
      ["/api/drivers/me/payouts"],
      ["/api/drivers/me/pix-key", { method: "PUT", body: { pixKey: "pix@x" } }],
      ["/api/admin/payouts/balances"],
      ["/api/admin/payouts"],
      ["/api/admin/payouts", { method: "POST", body: { driverSub: "d1", amountCents: 1000, note: null } }],
      ["/api/admin/payouts", { method: "POST", body: { driverSub: "d1", amountCents: 1000, note: "obs" } }],
    ]);
  });
});
