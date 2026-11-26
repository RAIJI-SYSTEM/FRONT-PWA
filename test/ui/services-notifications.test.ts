import { beforeEach, describe, expect, it, vi } from "vitest";

const backendMock = vi.hoisted(() => vi.fn());
const apiFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/backend/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/backend/client")>();
  return { ...actual, backend: backendMock };
});
vi.mock("@/services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api")>();
  return { ...actual, apiFetch: apiFetchMock };
});

import {
  deleteNotification,
  getNotificationPreferences,
  listNotifications,
  markNotificationsRead,
  updateNotificationPreferences,
} from "@/services/notifications";

const notification = (overrides: Record<string, unknown> = {}) => ({
  id: "n1",
  kind: "RIDE_REQUEST_ACCEPTED",
  message: "Sua vaga foi confirmada.",
  createdAt: "2026-11-25T10:00:00.000Z",
  read: false,
  rideId: "r1",
  referenceId: null,
  audience: "PASSENGER",
  ...overrides,
});

beforeEach(() => {
  backendMock.mockReset();
  apiFetchMock.mockReset();
});

describe("listNotifications", () => {
  it("passageiro consulta PASSENGER + COMPANY e ordena do mais novo", async () => {
    backendMock.mockImplementation(async (_path, init) =>
      init.query.audience === "PASSENGER"
        ? [notification({ id: "a", createdAt: "2026-11-25T09:00:00.000Z" })]
        : [notification({ id: "b", kind: "DELIVERY_ACCEPTED", createdAt: "2026-11-25T11:00:00.000Z", audience: "COMPANY" })],
    );

    const list = await listNotifications("passenger");
    expect(backendMock.mock.calls.map((c) => c[1].query.audience)).toEqual(["PASSENGER", "COMPANY"]);
    expect(list.map((n) => n.id)).toEqual(["b", "a"]);
    expect(list[0]).toMatchObject({ category: "deliveries", title: "Encomenda aceita", body: "Sua vaga foi confirmada.", href: "/encomendas" });
  });

  it("motorista consulta só DRIVER e usa links do modo motorista", async () => {
    backendMock.mockResolvedValue([notification({ kind: "RIDE_REQUEST" })]);
    const [item] = await listNotifications("driver");
    expect(backendMock.mock.calls[0]![1].query.audience).toBe("DRIVER");
    expect(item).toMatchObject({ category: "trips", title: "Novo pedido de vaga", href: "/motorista/rotas/gerenciar?id=r1" });
  });

  it("motorista sem rideId vai para a lista de rotas", async () => {
    backendMock.mockResolvedValue([notification({ rideId: null })]);
    expect((await listNotifications("driver"))[0]!.href).toBe("/motorista/rotas");
  });

  it("pagamentos e repasses", async () => {
    backendMock.mockResolvedValue([
      notification({ id: "p", kind: "RIDE_PAYMENT_RECEIVED" }),
      notification({ id: "payout", kind: "DRIVER_PAYOUT_SENT" }),
    ]);
    const list = await listNotifications("driver");
    expect(list.find((n) => n.id === "p")).toMatchObject({ category: "payments" });
    expect(list.find((n) => n.id === "payout")).toMatchObject({ category: "payments", href: "/motorista/repasses" });
  });

  it("fretes: empresa, motorista e oferta aceita", async () => {
    backendMock.mockResolvedValue([
      notification({ id: "f1", kind: "FREIGHT_PROPOSAL", audience: "COMPANY", referenceId: "fr1" }),
      notification({ id: "f2", kind: "FREIGHT_PROPOSAL", audience: "DRIVER", referenceId: null }),
      notification({ id: "f3", kind: "FREIGHT_OFFER_ACCEPTED", audience: "DRIVER", referenceId: "fr1" }),
      notification({ id: "f4", kind: "FREIGHT_ACCEPTED", audience: "COMPANY", referenceId: "fr1" }),
    ]);

    const company = await listNotifications("passenger");
    expect(company.find((n) => n.id === "f1")!.href).toBe("/empresa/frete?id=fr1");
    expect(company.find((n) => n.id === "f4")!.href).toBe("/empresa/frete?id=fr1");

    const driver = await listNotifications("driver");
    expect(driver.find((n) => n.id === "f2")!.href).toBe("/motorista/fretes");
    expect(driver.find((n) => n.id === "f3")!.href).toBe("/motorista/rotas");
  });

  it("mural e aviso desconhecido", async () => {
    backendMock.mockResolvedValue([
      notification({ id: "b1", kind: "BOARD_OFFER", referenceId: "b1" }),
      notification({ id: "b2", kind: "BOARD_OFFER_DECLINED" }),
      notification({ id: "x", kind: "OUTRO" }),
    ]);
    const list = await listNotifications("passenger");
    expect(list.find((n) => n.id === "b1")!.href).toBe("/mural?id=b1");
    expect(list.find((n) => n.id === "b2")!.href).toBe("/motorista/pedidos");
    expect(list.find((n) => n.id === "x")!.title).toBe("Aviso");
  });
});

describe("marcar como lidas / apagar", () => {
  it("marca todas de cada público e recarrega a lista", async () => {
    backendMock.mockResolvedValue([]);
    await markNotificationsRead("passenger");
    expect(backendMock.mock.calls.filter((c) => c[0] === "/api/notifications/read")).toHaveLength(2);
    expect(backendMock.mock.calls[0]![1]).toMatchObject({ method: "POST", body: { audience: "PASSENGER", ids: [] } });
  });

  it("apaga marcando um id", async () => {
    backendMock.mockResolvedValue([]);
    await deleteNotification("driver", "n1");
    expect(backendMock.mock.calls[0]![1]).toMatchObject({ body: { audience: "DRIVER", ids: ["n1"] } });
  });
});

describe("preferências", () => {
  it("lê e atualiza (com ?modo=motorista)", async () => {
    apiFetchMock.mockResolvedValue({ trips: true });
    await getNotificationPreferences("driver");
    expect(apiFetchMock).toHaveBeenCalledWith("/api/notifications/preferences?modo=motorista");

    await getNotificationPreferences("passenger");
    expect(apiFetchMock).toHaveBeenLastCalledWith("/api/notifications/preferences");

    await updateNotificationPreferences("driver", { promotions: false });
    expect(apiFetchMock).toHaveBeenLastCalledWith("/api/notifications/preferences?modo=motorista", {
      method: "PATCH",
      body: JSON.stringify({ promotions: false }),
    });
  });
});
