import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
const drivingRoute = vi.hoisted(() => vi.fn());

vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});
vi.mock("@/services/mapbox", () => ({ getDrivingRoute: drivingRoute }));

import * as dm from "@/services/driverMode";

const rideApi = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  status: "PLANNED",
  type: "MIXED",
  originCity: "São Paulo",
  originState: "SP",
  destinationCity: "Campinas",
  destinationState: "SP",
  originAddress: "Rua A, 1",
  destinationAddress: "Rua B, 2",
  meetingPoint: "Posto",
  departureDate: "2026-11-20T08:00:00",
  vehicleId: "v1",
  totalSeats: 3,
  availableSeats: 1,
  pricePerPassenger: 50,
  pricePerPackage: 20,
  driverReceivesPerPassenger: 42.5,
  cargoDetails: { maxWeightKg: 25 },
  bookingsClosed: false,
  visibility: "PUBLIC",
  routeDistanceMeters: 100_000,
  platformFeePercent: 15,
  originLatitude: -23.5,
  originLongitude: -46.6,
  destinationLatitude: -22.9,
  destinationLongitude: -47.0,
  driverSub: "d1",
  driverName: "Carlos",
  ...overrides,
});

const bookingApi = (overrides: Record<string, unknown> = {}) => ({
  id: "b1",
  status: "PENDING",
  passengerSub: "p1",
  passengerName: "Ana",
  pickupAddress: null,
  dropoffAddress: null,
  price: 50,
  baggage: [{ type: "mala", quantity: 1, lengthCm: 70, widthCm: 45, heightCm: 30, weightKg: 15 }],
  pendingBaggage: [],
  fullRoute: true,
  ...overrides,
});

const deliveryApi = (overrides: Record<string, unknown> = {}) => ({
  id: "d1",
  status: "PENDING",
  senderSub: "s1",
  senderName: "Loja",
  pickupAddress: null,
  dropoffAddress: null,
  driverReceives: 20,
  size: "MEDIUM",
  fragile: true,
  weightKg: 2,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  fullRoute: true,
  ...overrides,
});

const place = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Av. Paulista",
  address: "1000",
  city: "São Paulo",
  state: "SP",
  coordinates: [-46.65, -23.56] as [number, number],
  ...overrides,
});

beforeEach(() => {
  backendMock.mockReset();
  drivingRoute.mockReset().mockResolvedValue(null);
  localStorage.clear();
});

describe("conta do motorista", () => {
  it("aprovado: devolve CNH, veículos ativos e sem revisão", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/users/me") return { driver: true };
      if (path === "/api/users/me/driver/cnh") return { status: "APPROVED", categoria: "B", validade: "2030-01-01" };
      if (path === "/api/vehicles") return [
        { id: "v1", active: true, type: "CARRO", model: "Onix", year: 2020, color: "Prata", plate: "ABC1D23", passengerSeats: 4 },
        { id: "v2", active: true, type: "VAN", model: "Sprinter", year: null, color: null, plate: "XYZ9Z99", passengerSeats: null },
        { id: "v3", active: false, type: "MOTO", model: "X", plate: "AAA1A11" },
      ];
      return null;
    });

    const account = await dm.getDriverAccount();
    expect(account).toMatchObject({
      status: "approved",
      cnh: { category: "B", expiresAt: "2030-01-01" },
      testMode: false,
      securityCodeRequired: true,
    });
    expect(account.vehicles).toHaveLength(2);
    expect(account.vehicles[0]).toMatchObject({ type: "car", primary: true, seats: 4 });
    expect(account.vehicles[1]).toMatchObject({ type: "van", primary: false, year: 0, seats: 0 });
  });

  it("em análise e sem cadastro", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/users/me") return { driver: false };
      if (path === "/api/users/me/driver/cnh") return { status: "PROCESSING", reason: "foto ilegível", testMode: true, securityCodeRequired: false };
      return [];
    });
    const inReview = await dm.getDriverAccount();
    expect(inReview).toMatchObject({ status: "in_review", review: { status: "PROCESSING", reason: "foto ilegível" }, testMode: true });

    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/users/me") return { driver: false };
      if (path === "/api/users/me/driver/cnh") throw new Error("404");
      return [];
    });
    const none = await dm.getDriverAccount();
    expect(none.status).toBe("none");
    expect(none.vehicles).toEqual([]);
    expect(none.cnh).toBeUndefined();
  });

  it("tolera falha ao listar veículos", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/users/me") return { driver: true };
      if (path === "/api/users/me/driver/cnh") return { status: "NONE" };
      throw new Error("fora");
    });
    await expect(dm.getDriverAccount()).resolves.toMatchObject({ status: "approved", vehicles: [] });
  });

  it("envia a CNH e recarrega a conta", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/users/me") return { driver: false };
      if (path === "/api/users/me/driver/cnh" && path.includes("cnh")) return { status: "PROCESSING" };
      return [];
    });
    const image = new File(["x"], "cnh.jpg", { type: "image/jpeg" });
    await dm.saveCnh({ image, securityCode: "123" });
    const post = backendMock.mock.calls.find((c) => c[0] === "/api/users/me/driver/cnh" && c[1]?.method === "POST");
    expect(post![1].body).toBeInstanceOf(FormData);
  });

  it("adiciona, atualiza e remove veículos", async () => {
    const account = { status: "approved", vehicles: [{ id: "v1", active: true, type: "car", model: "Onix", year: 2020, color: "Prata", plate: "ABC1D23", seats: 4, primary: true }] };
    backendMock.mockImplementation(async (path: string, init?: { method?: string; body?: unknown }) => {
      if (path === "/api/users/me") return { driver: true };
      if (path === "/api/users/me/driver/cnh") return { status: "APPROVED" };
      if (path === "/api/vehicles" && init?.method === "POST") return {};
      if (path === "/api/vehicles/v1" && init?.method === "PUT") return {};
      if (path === "/api/vehicles/v1" && init?.method === "DELETE") return undefined;
      return account.vehicles;
    });

    await dm.addVehicle({ type: "van", model: "Sprinter", seats: 15 });
    const created = backendMock.mock.calls.find((c) => c[0] === "/api/vehicles" && c[1]?.method === "POST");
    expect(created![1].body).toEqual({ plate: undefined, type: "VAN", model: "Sprinter", color: undefined, year: undefined, passengerSeats: 15 });

    // só "principal": não chama a API
    backendMock.mockClear();
    await dm.updateVehicle("v1", { primary: true });
    expect(backendMock.mock.calls.every((c) => c[1]?.method !== "PUT")).toBe(true);

    await dm.updateVehicle("v1", { color: "Preto" });
    const updated = backendMock.mock.calls.find((c) => c[0] === "/api/vehicles/v1" && c[1]?.method === "PUT");
    expect(updated![1].body).toMatchObject({ model: "Onix", color: "Preto", type: "CARRO" });

    await dm.removeVehicle("v1");
    expect(backendMock.mock.calls.some((c) => c[0] === "/api/vehicles/v1" && c[1]?.method === "DELETE")).toBe(true);
  });
});

describe("rotas publicadas", () => {
  it("converte a carona no formato da tela", () => {
    expect(dm.toDriverRoute(rideApi() as never)).toMatchObject({
      id: "r1",
      departurePoint: "Posto",
      seats: 3,
      seatsTaken: 2,
      pricePerSeatCents: 5000,
      acceptsPackages: true,
      status: "published",
      maxCargoKg: 25,
      driverReceivesPerSeatCents: 4250,
      private: false,
    });
    expect(dm.toDriverRoute(rideApi({ status: "IN_PROGRESS" }) as never).status).toBe("in_progress");
    expect(dm.toDriverRoute(rideApi({ status: "COMPLETED" }) as never).status).toBe("completed");
    expect(dm.toDriverRoute(rideApi({ status: "CANCELLED" }) as never).status).toBe("canceled");
    expect(dm.toDriverRoute(rideApi({ type: "PASSENGER", meetingPoint: null, originAddress: null, visibility: "PRIVATE" }) as never)).toMatchObject({
      acceptsPackages: false,
      departurePoint: "",
      private: true,
    });
  });

  it("lista minhas caronas (com filtro de status)", async () => {
    backendMock.mockResolvedValue([rideApi()]);
    const routes = await dm.listDriverRoutes();
    expect(routes[0]!.id).toBe("r1");
    expect(backendMock).toHaveBeenCalledWith("/api/rides/mine", {
      query: { status: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
    });
  });

  it("descobre a UF pelo estado ou pelo endereço", () => {
    expect(dm.stateOf({ state: "RJ" })).toBe("RJ");
    expect(dm.stateOf({ address: "Rua X, 10 - MG" })).toBe("MG");
    expect(dm.stateOf({})).toBe("SP");
  });

  it("publica a rota calculando o trajeto e escolhendo o tipo", async () => {
    drivingRoute.mockResolvedValue({
      geometry: { type: "LineString", coordinates: [[-46.6, -23.5], [-47, -22.9]] },
      distanceMeters: 1000,
      durationSeconds: 60,
    });
    backendMock.mockResolvedValue(rideApi());

    const route = await dm.publishRoute({
      origin: place() as never,
      destination: place({ city: undefined, name: "Campinas", coordinates: [-47, -22.9] }) as never,
      departureAt: new Date("2026-12-01T10:00:00Z"),
      vehicleId: "v1",
      seats: 2,
      acceptsPackages: true,
      pricePerSeatCents: 5000,
      pricePerPackageCents: 1000,
      maxCargoKg: 10,
      departurePoint: "Posto",
    });

    const body = backendMock.mock.calls[0]![1].body;
    expect(body).toMatchObject({
      type: "MIXED",
      originCity: "São Paulo",
      destinationCity: "Campinas",
      totalSeats: 2,
      pricePerPassenger: 50,
      pricePerPackage: 10,
      meetingPoint: "Posto",
      cargoDetails: { maxWeightKg: 10 },
    });
    expect(body.route).toEqual([{ latitude: -23.5, longitude: -46.6 }, { latitude: -22.9, longitude: -47 }]);
    expect(route.id).toBe("r1");
  });

  it("usa o trajeto já calculado e trata erros do cálculo", async () => {
    backendMock.mockResolvedValue(rideApi());
    await dm.publishRoute({
      origin: place() as never,
      destination: place() as never,
      departureAt: new Date(),
      vehicleId: "v1",
      directions: { geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] }, distanceMeters: 1, durationSeconds: 1 },
    });
    expect(drivingRoute).not.toHaveBeenCalled();

    drivingRoute.mockRejectedValue(new Error("sem mapa"));
    await dm.publishRoute({ origin: place() as never, destination: place() as never, departureAt: new Date(), vehicleId: "v1" });
    expect(backendMock.mock.calls.at(-1)![1].body.route).toBeUndefined();
  });

  it("valida os campos obrigatórios", async () => {
    await expect(dm.publishRoute({})).rejects.toMatchObject({ status: 400 });
  });

  it("tipos CARGO e PASSENGER zeram os campos que não se aplicam", async () => {
    backendMock.mockResolvedValue(rideApi());
    await dm.publishRoute({
      origin: place() as never,
      destination: place() as never,
      departureAt: new Date(),
      vehicleId: "v1",
      seats: 0,
      acceptsPackages: true,
      maxCargoKg: null,
      directions: null,
    });
    expect(backendMock.mock.calls[0]![1].body).toMatchObject({ type: "CARGO", totalSeats: 0, pricePerPassenger: null, cargoDetails: { maxWeightKg: 30 } });

    backendMock.mockClear();
    await dm.publishRoute({
      origin: place() as never,
      destination: place() as never,
      departureAt: new Date(),
      vehicleId: "v1",
      seats: 2,
      acceptsPackages: false,
      directions: null,
    });
    expect(backendMock.mock.calls[0]![1].body).toMatchObject({ type: "PASSENGER", pricePerPackage: null, cargoDetails: null });
  });

  it("ações da rota", async () => {
    backendMock.mockResolvedValue(rideApi());
    await dm.cancelRoute("r1");
    await dm.startRide("r1");
    await dm.finishRide("r1");
    await dm.closeBookings("r1");
    await dm.acceptAllRequests("r1");
    await dm.listRideBookings("r1");
    await dm.listRideDeliveries("r1");
    await dm.decideBaggageChange("r1", "b1", true);
    await dm.pickUpDelivery("d1", "1234");
    await dm.deliverDelivery("d1", "4321");

    const calls = backendMock.mock.calls.map((c) => [c[0], c[1]?.method, c[1]?.body]);
    expect(calls).toEqual([
      ["/api/rides/r1/cancel", "POST", {}],
      ["/api/rides/r1/start", "POST", undefined],
      ["/api/rides/r1/finish", "POST", undefined],
      ["/api/rides/r1/close-bookings", "POST", undefined],
      ["/api/rides/r1/requests/accept-all", "POST", undefined],
      ["/api/rides/r1/requests", undefined, undefined],
      ["/api/rides/r1/deliveries", undefined, undefined],
      ["/api/rides/r1/requests/b1/baggage", "PATCH", { decision: "ACCEPT" }],
      ["/api/deliveries/d1/pickup", "POST", { code: "1234" }],
      ["/api/deliveries/d1/deliver", "POST", { code: "4321" }],
    ]);
  });
});

describe("pedidos e trabalhos", () => {
  const routeFor = (rides: unknown[], bookings: unknown[] = [], deliveries: unknown[] = []) =>
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/rides/mine") return rides;
      if (path.endsWith("/requests")) return bookings;
      if (path.endsWith("/deliveries")) return deliveries;
      return [];
    });

  it("lista pedidos de vaga, mudanças de bagagem e encomendas", async () => {
    routeFor(
      [rideApi({ departureDate: "2026-11-20T08:00:00" })],
      [
        bookingApi({ id: "pendente", status: "PENDING", price: 100 }),
        bookingApi({ id: "mudanca", status: "CONFIRMED", pendingBaggage: [{ type: "caixa", quantity: 2 }] }),
        bookingApi({ id: "ignorada", status: "CONFIRMED", pendingBaggage: [] }),
      ],
      [deliveryApi({ id: "encomenda" }), deliveryApi({ id: "aceita", status: "CONFIRMED" })],
    );

    const requests = await dm.listRegionRequests();
    expect(requests.map((r) => r.id)).toEqual(["ride:r1:pendente", "ride:r1:mudanca", "delivery:r1:encomenda"]);
    expect(requests[0]).toMatchObject({ kind: "ride", earningsCents: 8500, distanceKm: 100, status: "open" });
    expect(requests[1]).toMatchObject({ baggageChange: true, cargoSummary: "Quer mudar a bagagem para: 2× caixa" });
    expect(requests[2]).toMatchObject({ kind: "delivery", packageSize: "medium", earningsCents: 2000, cargoSummary: "2 kg · 30×20×10 cm" });
  });

  it("marca quando é 'agora' ou agendado", async () => {
    const soon = new Date(Date.now() + 30 * 60_000);
    const wallClock = `${soon.getFullYear()}-${String(soon.getMonth() + 1).padStart(2, "0")}-${String(soon.getDate()).padStart(2, "0")}T${String(soon.getHours()).padStart(2, "0")}:${String(soon.getMinutes()).padStart(2, "0")}:00`;
    routeFor([rideApi({ departureDate: wallClock })], [bookingApi()], []);
    expect((await dm.listRegionRequests())[0]!.when.type).toBe("now");

    routeFor([rideApi({ departureDate: "2099-01-01T08:00:00" })], [bookingApi()], []);
    expect((await dm.listRegionRequests())[0]!.when.type).toBe("scheduled");
  });

  it("não busca encomendas de carona só de passageiros nem vagas de carona só de carga", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/rides/mine") return [rideApi({ type: "CARGO" }), rideApi({ id: "r2", type: "PASSENGER" })];
      if (path.endsWith("/requests")) return [bookingApi()];
      if (path.endsWith("/deliveries")) return [deliveryApi()];
      return [];
    });
    await dm.listRegionRequests();
    const calls = backendMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/api/rides/r1/deliveries");
    expect(calls).not.toContain("/api/rides/r1/requests");
    expect(calls).toContain("/api/rides/r2/requests");
    expect(calls).not.toContain("/api/rides/r2/deliveries");
  });

  it("aceita/recusa vaga e mudança de bagagem", async () => {
    backendMock.mockImplementation(async (path: string) => {
      if (path === "/api/rides/r1/requests") return [bookingApi({ id: "b1", status: "PENDING" }), bookingApi({ id: "b2", status: "CONFIRMED", pendingBaggage: [{ type: "caixa" }] })];
      return {};
    });
    await expect(dm.respondToRequest("ride:r1:b1", "accept")).resolves.toMatchObject({ request: { status: "accepted" } });
    await dm.respondToRequest("ride:r1:b2", "reject");
    await dm.respondToRequest("delivery:r1:d1", "accept");

    const calls = backendMock.mock.calls.map((c) => [c[0], c[1]?.method, c[1]?.body]);
    expect(calls).toEqual([
      ["/api/rides/r1/requests", undefined, undefined],
      ["/api/rides/r1/requests/b1", "PATCH", { decision: "ACCEPT" }],
      ["/api/rides/r1/requests", undefined, undefined],
      ["/api/rides/r1/requests/b2/baggage", "PATCH", { decision: "REJECT" }],
      ["/api/rides/r1/deliveries/d1", "PATCH", { decision: "ACCEPT", reason: undefined }],
    ]);
  });

  it("lista trabalhos aceitos/concluídos e ordena por data", async () => {
    routeFor(
      [rideApi({ id: "r1", departureDate: "2026-11-20T08:00:00" }), rideApi({ id: "r2", status: "IN_PROGRESS", departureDate: "2026-11-21T08:00:00" })],
      [bookingApi({ id: "b1", status: "CONFIRMED" }), bookingApi({ id: "b2", status: "COMPLETED" }), bookingApi({ id: "b3", status: "PENDING" })],
      [deliveryApi({ id: "d1", status: "IN_TRANSIT" }), deliveryApi({ id: "d2", status: "DELIVERED" }), deliveryApi({ id: "d3", status: "CANCELLED" })],
    );

    const jobs = await dm.listDriverJobs();
    expect(jobs.map((j) => j.id)).toEqual([
      "ride:r2:b1",
      "ride:r2:b2",
      "delivery:r2:d1",
      "delivery:r2:d2",
      "ride:r1:b1",
      "ride:r1:b2",
      "delivery:r1:d1",
      "delivery:r1:d2",
    ]);
    expect(jobs[4]).toMatchObject({ status: "accepted", earningsCents: 4250 });
    expect(jobs[6]).toMatchObject({ status: "in_progress", deliveryStatus: "IN_TRANSIT", customerName: "Loja" });
    expect(jobs[0]!.status).toBe("in_progress");
  });

  it("avalia o cliente e devolve o trabalho atualizado", async () => {
    routeFor([rideApi()], [bookingApi({ id: "b1", status: "CONFIRMED" })], []);
    const job = await dm.rateCustomer("ride:r1:b1", { stars: 5, tags: ["Pontual"], comment: "ok" });
    expect(job.customerRating).toMatchObject({ stars: 5, comment: "ok" });
    expect(JSON.parse(localStorage.getItem("raiji.customerRatings")!)).toMatchObject({ "ride:r1:b1": { stars: 5 } });

    await expect(dm.rateCustomer("ride:r1:nao-existe", { stars: 1 })).rejects.toMatchObject({ status: 404 });
  });
});
