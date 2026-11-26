import { beforeEach, describe, expect, it, vi } from "vitest";

const st = vi.hoisted(() => ({
  session: null as null | { user: { id: string } },
  chat: vi.fn(),
}));

vi.mock("@/services/auth", () => ({ getSession: () => st.session }));
vi.mock("@/services/chat", () => ({ chat: st.chat }));

import { ApiError } from "@/services/api";
import {
  findRideGroup,
  getConversation,
  listConversations,
  openDirectChat,
  sendMessage,
  toAttachment,
  type ChatAttachmentApi,
} from "@/services/messages";
import { uploadFile } from "@/services/uploads";

const attachment = (overrides: Partial<ChatAttachmentApi> = {}): ChatAttachmentApi => ({
  id: "att-1",
  type: "image",
  name: "foto.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 10,
  url: "https://s3.example/f?X-Amz-Expires=900",
  expiresAt: "2026-12-01T10:00:00.000Z",
  expired: false,
  ...overrides,
});

const conversation = (overrides: Record<string, unknown> = {}) => ({
  _id: "conv-1",
  type: "direct",
  context: null,
  members: [
    { userId: "me", name: "Eu", role: "passenger" },
    { userId: "other", name: "Bruno", role: "driver" },
  ],
  lastMessage: {
    id: "m-1",
    senderId: "other",
    text: "oi",
    attachments: [],
    sentAt: "2026-11-25T12:00:00.000Z",
  },
  unreadCount: 3,
  group: null,
  ...overrides,
});

beforeEach(() => {
  st.chat.mockReset();
  st.session = { user: { id: "me" } };
});

describe("toAttachment", () => {
  it("usa o link quando válido", () => {
    expect(toAttachment(attachment())).toMatchObject({ id: "att-1", url: expect.stringContaining("s3.example"), expired: false });
  });

  it("zera link expirado ou ausente", () => {
    expect(toAttachment(attachment({ expired: true }))).toMatchObject({ url: "", expired: true });
    expect(toAttachment(attachment({ url: null }))).toMatchObject({ url: "", expired: true });
  });

  it("mantém a duração de áudio quando informada", () => {
    expect(toAttachment(attachment({ type: "audio", durationSeconds: 12 })).durationSeconds).toBe(12);
    expect("durationSeconds" in toAttachment(attachment())).toBe(false);
  });
});

describe("listConversations", () => {
  it("converte a conversa direta no modo passageiro", async () => {
    st.chat.mockResolvedValue([conversation()]);
    const [summary] = await listConversations("passenger");

    expect(summary).toMatchObject({
      id: "conv-1",
      mode: "passenger",
      kind: "driver",
      title: "Bruno",
      subtitle: "Motorista",
      unreadCount: 3,
    });
    expect(summary!.participants).toEqual([
      { id: "me", name: "Eu", role: "me" },
      { id: "other", name: "Bruno", role: "driver" },
    ]);
    expect(summary!.lastMessage?.senderId).toBe("other");
  });

  it("filtra pelo modo atual", async () => {
    st.chat.mockResolvedValue([
      conversation({ _id: "passageiro", members: [{ userId: "me", role: "passenger" }, { userId: "o1", role: "driver" }] }),
      conversation({ _id: "motorista", members: [{ userId: "me", role: "driver" }, { userId: "o2", role: "passenger" }] }),
    ]);

    expect((await listConversations("passenger")).map((c) => c.id)).toEqual(["passageiro"]);
    expect((await listConversations("driver")).map((c) => c.id)).toEqual(["motorista"]);
  });

  it("monta grupo com título, contagem de participantes e papéis", async () => {
    st.chat.mockResolvedValue([
      conversation({
        type: "group",
        group: { name: "Carona Campinas" },
        members: [{ userId: "me", role: null }, { userId: "o1", role: "driver" }],
      }),
    ]);
    const [summary] = await listConversations("passenger");
    expect(summary).toMatchObject({ kind: "group", title: "Carona Campinas", subtitle: "2 participantes" });
    expect(summary!.participants[1]).toMatchObject({ name: "Motorista", role: "driver" });
  });

  it("cai em 'Contato'/'Conversa' quando faltam nomes", async () => {
    st.chat.mockResolvedValue([
      conversation({ members: [{ userId: "me", role: "passenger" }, { userId: "o1", role: null, name: null }] }),
    ]);
    const [summary] = await listConversations("passenger");
    expect(summary!.participants[1]!.name).toBe('Contato');
    expect(summary!.title).toBe('Contato');
  });

  it("usa o primeiro nome do outro participante como título", async () => {
    st.chat.mockResolvedValue([
      conversation({ members: [{ userId: "me", role: "passenger" }, { userId: "o1", role: "driver", name: null }, { userId: "o2", role: "driver", name: "Zé" }] }),
    ]);
    const [summary] = await listConversations("passenger");
    expect(summary!.title).toBe("Motorista");
  });

  it("gera o link do contexto da corrida/encomenda conforme o modo", async () => {
    const context = { kind: "ride", label: "SP → Campinas", origin: "SP", destination: "Campinas", refId: "r1", subId: "sub-1" };
    st.chat.mockResolvedValue([conversation({ context })]);

    const [passenger] = await listConversations("passenger");
    expect(passenger!.context?.href).toBe("/viagem/reserva?id=sub-1");

    st.chat.mockResolvedValue([
      conversation({ context, members: [{ userId: "me", name: "Eu", role: "driver" }, { userId: "other", name: "Bruno", role: "passenger" }] }),
    ]);
    const [driver] = await listConversations("driver");
    expect(driver!.context?.href).toBe("/motorista/rotas/gerenciar?id=r1");

    st.chat.mockResolvedValue([conversation({ context: { ...context, kind: "delivery", subId: "d-1" } })]);
    expect((await listConversations("passenger"))[0]!.context?.href).toBe("/encomenda?id=d-1");

    st.chat.mockResolvedValue([conversation({ context: { ...context, kind: "delivery", subId: null } })]);
    expect((await listConversations("passenger"))[0]!.context?.href).toBe("/encomendas");

    st.chat.mockResolvedValue([conversation({ context: { ...context, subId: null } })]);
    expect((await listConversations("passenger"))[0]!.context?.href).toBe("/corridas");
  });

  it("troca os ids do próprio usuário por ME_ID nas mensagens", async () => {
    st.chat.mockResolvedValue([
      conversation({
        lastMessage: { id: "m", senderId: "me", text: "eu", attachments: [], sentAt: "2026-11-25T12:00:00.000Z" },
      }),
    ]);
    const [summary] = await listConversations("passenger");
    expect(summary!.lastMessage?.senderId).toBe("me");
  });

  it("funciona sem sessão (id vazio)", async () => {
    st.session = null;
    st.chat.mockResolvedValue([conversation()]);
    const [summary] = await listConversations("passenger");
    expect(summary!.mode).toBe("passenger");
  });
});

describe("getConversation / sendMessage / openDirectChat / findRideGroup", () => {
  it("abre a conversa com as mensagens (sem não lidas)", async () => {
    st.chat
      .mockResolvedValueOnce(conversation())
      .mockResolvedValueOnce([
        { id: "m1", senderId: "me", text: "oi", attachments: [attachment({ expired: true })], sentAt: "2026-11-25T12:00:00.000Z" },
      ]);

    const conversationResult = await getConversation("conv-1");
    expect(st.chat).toHaveBeenCalledWith("/conversations/conv-1");
    expect(st.chat).toHaveBeenCalledWith("/conversations/conv-1/messages?limit=100");
    expect(conversationResult.unreadCount).toBe(0);
    expect(conversationResult.messages[0]!.attachments[0]!.url).toBe("");
  });

  it("envia mensagem e converte a resposta", async () => {
    st.chat.mockResolvedValue({ id: "m9", senderId: "me", text: "olá", attachments: [], sentAt: "2026-11-25T12:00:00.000Z" });
    const sent = await sendMessage("conv-1", { text: "olá" });
    expect(st.chat).toHaveBeenCalledWith("/conversations/conv-1/messages", { method: "POST", body: { text: "olá" } });
    expect(sent.senderId).toBe("me");
  });

  it("abre conversa direta enviando só os campos preenchidos", async () => {
    st.chat.mockResolvedValue({ _id: "nova" });
    await expect(openDirectChat({ userId: "u2", role: "driver", myRole: "passenger" })).resolves.toBe("nova");
    expect(st.chat).toHaveBeenCalledWith("/conversations/direct", {
      method: "POST",
      body: { userId: "u2", role: "driver", myRole: "passenger" },
    });

    await openDirectChat({
      userId: "u3",
      name: "Carla",
      role: "passenger",
      myRole: "driver",
      context: { kind: "ride", refId: "r1", label: "x", origin: "a", destination: "b" },
    });
    expect(st.chat).toHaveBeenLastCalledWith("/conversations/direct", expect.objectContaining({ body: expect.objectContaining({ name: "Carla" }) }));
  });

  it("acha o grupo da carona e devolve null no 404", async () => {
    st.chat.mockResolvedValueOnce({ _id: "grupo" });
    await expect(findRideGroup("r 1")).resolves.toBe("grupo");
    expect(st.chat).toHaveBeenCalledWith("/conversations/by-ride/r%201");

    st.chat.mockRejectedValueOnce(new ApiError("não achou", 404));
    await expect(findRideGroup("r2")).resolves.toBeNull();

    st.chat.mockRejectedValueOnce(new ApiError("falhou", 500));
    await expect(findRideGroup("r3")).rejects.toMatchObject({ status: 500 });
  });
});

describe("uploadFile", () => {
  const file = new File([new Uint8Array(10)], "foto.jpg", { type: "image/jpeg" });

  beforeEach(() => {
    st.chat.mockReset();
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(() => "blob:local");
  });

  it("pede o link ao chat, envia ao S3 e devolve o anexo local", async () => {
    st.chat.mockResolvedValue({
      attachment: attachment(),
      upload: { method: "POST", url: "https://s3.example/upload", fields: { key: "k", policy: "p" }, expiresInSeconds: 300 },
    });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadFile("conv-1", file, { durationSeconds: 3 });
    expect(st.chat).toHaveBeenCalledWith("/conversations/conv-1/attachments", {
      method: "POST",
      body: { name: "foto.jpg", mimeType: "image/jpeg", sizeBytes: 10, durationSeconds: 3 },
    });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(result).toMatchObject({ id: "att-1", url: "blob:local", expired: false });
  });

  it("usa nome/tipo padrão quando o arquivo não informa", async () => {
    st.chat.mockResolvedValue({
      attachment: attachment(),
      upload: { method: "POST", url: "https://s3.example/upload", fields: {}, expiresInSeconds: 300 },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
    await uploadFile("conv-1", new File([], "", { type: "" }));
    expect(st.chat).toHaveBeenCalledWith(
      "/conversations/conv-1/attachments",
      expect.objectContaining({ body: expect.objectContaining({ name: "arquivo", mimeType: "application/octet-stream" }) }),
    );
  });

  it("erro de rede no S3 vira ApiError 0", async () => {
    st.chat.mockResolvedValue({
      attachment: attachment(),
      upload: { method: "POST", url: "https://s3.example/upload", fields: {}, expiresInSeconds: 300 },
    });
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    await expect(uploadFile("conv-1", file)).rejects.toMatchObject({ status: 0 });
  });

  it("recusa do armazenamento vira ApiError com o status", async () => {
    st.chat.mockResolvedValue({
      attachment: attachment(),
      upload: { method: "POST", url: "https://s3.example/upload", fields: {}, expiresInSeconds: 300 },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403 })));
    await expect(uploadFile("conv-1", file)).rejects.toMatchObject({ status: 403 });
  });
});
