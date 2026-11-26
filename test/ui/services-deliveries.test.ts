import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
const publishOnBoard = vi.hoisted(() => vi.fn());
const findRides = vi.hoisted(() => vi.fn());
const toOffer = vi.hoisted(() => vi.fn());

vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});
vi.mock("@/services/board", () => ({ publishOnBoard }));
vi.mock("@/services/rideSearch", () => ({ findRides, toOffer }));

import * as dl from "@/services/deliveries";

const STORAGE_KEY = "raiji.deliveryDrafts";

const place = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "Av. Paulista",
  address: "1000",
  city: "São Paulo",
  state: "SP",
  coordinates: [-46.65, -23.56] as [number, number],
  ...overrides,
});

const details = {
  size: "medium",
  description: "Caixa",
  weightKg: 2,
  fragile: true,
  declaredValueCents: 5000,
  recipientName: "Bia",
  recipientPhone: "+5511999999999",
  notes: "Cuidado",
} as never;

const results = (overrides: Record<string, unknown> = {}) => ({
  ride: { id: "r1" },
  fullRoute: false,
  ...overrides,
});

beforeEach(() => {
  backendMock.mockReset();
  publishOnBoard.mockReset();
  findRides.mockReset();
  toOffer.mockReset();
  sessionStorage.clear();
});

async function draft() {
  return dl.createDelivery(place({ city: "São Paulo" }) as never, place({ city: "Campinas" }) as never);
}

describe("rascunho", () => {
  it("cria, guarda e lê o rascunho", async () => {
    const created = await draft();
    expect(created).toMatchObject({ status: "awaiting_details", offers: [], intermunicipal: true });
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)[created.id]).toBeTruthy();
    await expect(dl.getDelivery(created.id)).resolves.toMatchObject({ id: created.id });
  });

  it("404 para rascunho inexistente e sessionStorage corrompido", async () => {
    await expect(dl.getDelivery("x")).rejects.toMatchObject({ status: 404 });
    sessionStorage.setItem(STORAGE_KEY, "{quebrado");
    await expect(dl.getDelivery("x")).rejects.toMatchObject({ status: 404 });
  });

  it("detalhes do pacote buscam caronas que levam encomenda", async () => {
    const created = await draft();
    findRides.mockResolvedValue([results()]);
    toOffer.mockReturnValue({ priceCents: 1000, etaMinutes: 10 });

    const updated = await dl.submitDeliveryDetails(created.id, {
      departure: { type: "now" },
      details,
    } as never);

    expect(findRides).toHaveBeenCalledWith(expect.anything(), expect.anything(), { type: "now" }, "PACKAGE");
    expect(updated).toMatchObject({ status: "results", details });
    expect(updated.offers).toHaveLength(1);
  });

  it("sem caronas, no_results", async () => {
    const created = await draft();
    findRides.mockResolvedValue([]);
    expect((await dl.submitDeliveryDetails(created.id, { departure: { type: "now" }, details } as never)).status).toBe("no_results");
  });
});

describe("publicar no mural", () => {
  it("exige detalhes e coleta agendada", async () => {
    const created = await draft();
    await expect(dl.publishDelivery(created.id)).rejects.toMatchObject({ status: 400 });

    findRides.mockResolvedValue([]);
    await dl.submitDeliveryDetails(created.id, { departure: { type: "now" }, details } as never);
    await expect(dl.publishDelivery(created.id)).rejects.toMatchObject({ status: 400, message: "O mural é para coletas agendadas." });
  });

  it("publica e guarda o id do mural", async () => {
    const created = await draft();
    findRides.mockResolvedValue([]);
    await dl.submitDeliveryDetails(created.id, { departure: { type: "scheduled", at: "2099-01-01T08:00:00.000Z" }, details } as never);
    publishOnBoard.mockResolvedValue({ id: "board-1" });

    await expect(dl.publishDelivery(created.id, "c1")).resolves.toEqual({ id: "board-1" });
    expect(publishOnBoard).toHaveBeenCalledWith(expect.objectContaining({ kind: "PACKAGE", companyId: "c1", details }));
    expect(await dl.getDelivery(created.id)).toMatchObject({ status: "published", boardId: "board-1" });
  });
});

describe("pedir espaço na carona", () => {
  it("exige detalhes", async () => {
    const created = await draft();
    await expect(dl.requestDeliverySpace(created.id, "r1")).rejects.toMatchObject({ status: 400 });
  });

  it("envia o trecho quando a carona é parcial e guarda códigos", async () => {
    const created = await draft();
    findRides.mockResolvedValue([results({ ride: { id: "r1" }, fullRoute: false })]);
    toOffer.mockReturnValue({ priceCents: 1, etaMinutes: 1 });
    await dl.submitDeliveryDetails(created.id, { departure: { type: "now" }, details } as never);

    backendMock.mockResolvedValue({ id: "backend-1", pickupCode: "1234", deliveryKeyword: "SOL-42", companyId: "c1" });
    const updated = await dl.requestDeliverySpace(created.id, "r1", "c1");

    const body = backendMock.mock.calls[0]![1].body;
    expect(backendMock.mock.calls[0]![0]).toBe("/api/rides/r1/deliveries");
    expect(body).toMatchObject({ companyId: "c1", pickup: { latitude: -23.56, longitude: -46.65 }, dropoff: { latitude: -23.56, longitude: -46.65 } });
    expect(body.pkg).toMatchObject({ size: "MEDIUM", declaredValue: 50, recipientName: "Bia" });
    expect(updated).toMatchObject({ status: "requested", backendId: "backend-1", pickupCode: "1234", keyword: "SOL-42" });
  });

  it("viagem inteira não envia trecho; encomenda sem resultado também funciona", async () => {
    const created = await draft();
    findRides.mockResolvedValue([results({ fullRoute: true })]);
    toOffer.mockReturnValue({ priceCents: 1, etaMinutes: 1 });
    await dl.submitDeliveryDetails(created.id, { departure: { type: "now" }, details } as never);

    backendMock.mockResolvedValue({ id: "b2" });
    await dl.requestDeliverySpace(created.id, "r-inexistente");
    expect(backendMock.mock.calls[0]![1].body.pickup).toBeUndefined();
    expect(backendMock.mock.calls[0]![1].body.companyId).toBeNull();
  });
});

describe("cancelar e listar", () => {
  it("cancela no backend quando já existe lá", async () => {
    const created = await draft();
    findRides.mockResolvedValue([results()]);
    toOffer.mockReturnValue({ priceCents: 1, etaMinutes: 1 });
    await dl.submitDeliveryDetails(created.id, { departure: { type: "now" }, details } as never);
    backendMock.mockResolvedValueOnce({ id: "backend-1" });
    await dl.requestDeliverySpace(created.id, "r1");

    backendMock.mockResolvedValueOnce({});
    const canceled = await dl.cancelDelivery(created.id);
    expect(canceled.status).toBe("canceled");
    expect(backendMock).toHaveBeenLastCalledWith("/api/deliveries/backend-1/cancel", { method: "POST", body: {} });
  });

  it("cancela só localmente quando ainda é rascunho", async () => {
    const created = await draft();
    await dl.cancelDelivery(created.id);
    expect(backendMock).not.toHaveBeenCalled();
  });

  it("lista encomendas do backend", async () => {
    backendMock.mockResolvedValue([{ id: "d1" }]);
    await expect(dl.listMyDeliveries()).resolves.toEqual([{ id: "d1" }]);
    await dl.getDeliveryApi("d1");
    expect(backendMock).toHaveBeenLastCalledWith("/api/deliveries/d1");
  });
});
