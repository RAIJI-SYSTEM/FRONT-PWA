import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const oidcState = vi.hoisted(() => ({ createSigninRequest: vi.fn(), processSigninResponse: vi.fn() }));
const cap = vi.hoisted(() => ({
  native: false,
  open: vi.fn(),
  close: vi.fn(),
  addListener: vi.fn(),
  getLaunchUrl: vi.fn(),
}));

vi.mock("oidc-client-ts", () => ({
  OidcClient: class {
    createSigninRequest = oidcState.createSigninRequest;
    processSigninResponse = oidcState.processSigninResponse;
  },
  WebStorageStateStore: class {},
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => cap.native } }));
vi.mock("@capacitor/browser", () => ({ Browser: { open: cap.open, close: cap.close } }));
vi.mock("@capacitor/app", () => ({ App: { addListener: cap.addListener, getLaunchUrl: cap.getLaunchUrl } }));

const STORAGE_KEY = "raiji.auth.session";

const session = (overrides: Record<string, unknown> = {}) => ({
  accessToken: "access-1",
  refreshToken: "refresh-1",
  idToken: "id-1",
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "kc-1", email: "ana@example.com", name: "Ana" },
  ...overrides,
});

const jwt = (payload: Record<string, unknown>) => `h.${btoa(JSON.stringify(payload))}.s`;

async function load() {
  vi.resetModules();
  return import("@/services/auth");
}

beforeEach(() => {
  localStorage.clear();
  cap.native = false;
  oidcState.createSigninRequest.mockReset();
  oidcState.processSigninResponse.mockReset();
  cap.open.mockReset();
  cap.close.mockReset().mockResolvedValue(undefined);
  cap.addListener.mockReset().mockResolvedValue(undefined);
  cap.getLaunchUrl.mockReset().mockResolvedValue(undefined);
  vi.unstubAllGlobals();
});

afterEach(() => vi.restoreAllMocks());

describe("sessão", () => {
  it("lê a sessão do localStorage e ignora JSON inválido", async () => {
    const auth = await load();
    expect(auth.getSession()).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ accessToken: "guardado" })));
    const fresh = await load();
    expect(fresh.getSession()?.accessToken).toBe("guardado");

    localStorage.setItem(STORAGE_KEY, "{quebrado");
    const broken = await load();
    expect(broken.getSession()).toBeNull();
  });

  it("atualiza a sessão em outra aba (evento storage) e cancela a assinatura", async () => {
    const auth = await load();
    const listener = vi.fn();
    const unsubscribe = auth.subscribeSession(listener);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ accessToken: "de-outra-aba" })));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

    expect(auth.getSession()?.accessToken).toBe("de-outra-aba");
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reconhece a role admin no token", async () => {
    const auth = await load();
    expect(auth.isAdmin({ ...session(), accessToken: jwt({ realm_access: { roles: ["admin"] } }) } as never)).toBe(true);
    expect(auth.isAdmin({ ...session(), accessToken: jwt({ realm_access: { roles: ["user"] } }) } as never)).toBe(false);
    expect(auth.isAdmin(null)).toBe(false);
    expect(auth.isAdmin({ ...session(), accessToken: "inválido" } as never)).toBe(false);
  });
});

describe("token", () => {
  it("devolve null sem sessão", async () => {
    const auth = await load();
    await expect(auth.getAccessToken()).resolves.toBeNull();
  });

  it("reaproveita o token válido", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ accessToken: "válido" })));
    const auth = await load();
    await expect(auth.getAccessToken()).resolves.toBe("válido");
  });

  it("renova quando está para vencer", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ expiresAt: Math.floor(Date.now() / 1000) + 5 })));
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ access_token: "novo", expires_in: 300 }) }));
    vi.stubGlobal("fetch", fetchMock);

    const auth = await load();
    await expect(auth.getAccessToken()).resolves.toBe("novo");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/token", expect.objectContaining({ method: "POST" }));
    expect(auth.getSession()?.accessToken).toBe("novo");
    expect(auth.getSession()?.refreshToken).toBe("refresh-1");
  });

  it("expira a sessão quando a renovação falha", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ expiresAt: 0 })));
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));

    const auth = await load();
    await expect(auth.getAccessToken()).rejects.toBeInstanceOf(auth.SessionExpiredError);
    expect(auth.getSession()).toBeNull();
  });

  it("expira quando não há refresh token", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session({ expiresAt: 0, refreshToken: undefined })));
    const auth = await load();
    await expect(auth.getAccessToken()).rejects.toBeInstanceOf(auth.SessionExpiredError);
  });

  it("força a renovação", async () => {
    const auth = await load();
    await expect(auth.forceRefreshSession()).resolves.toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session()));
    const current = await load();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ access_token: "forçado" }) })));
    const result = await current.forceRefreshSession();
    expect(result?.accessToken).toBe("forçado");
  });
});

describe("login", () => {
  it("web: monta o pedido de login e redireciona a página", async () => {
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ origin: "http://app.local", assign, search: "" } as never);
    oidcState.createSigninRequest.mockResolvedValue({ url: "http://localhost:8000/realms/raiji/protocol/openid-connect/auth?client_id=raiji-api" });

    const auth = await load();
    await auth.signIn({ returnTo: "/corridas" });
    expect(oidcState.createSigninRequest).toHaveBeenCalledWith(expect.objectContaining({ state: { returnTo: "/corridas" } }));
    expect(oidcState.createSigninRequest).toHaveBeenCalledWith(expect.objectContaining({ ui_locales: "pt-BR" }));
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/auth?"));
  });

  it("cadastro troca o endpoint de login pelo de registro", async () => {
    cap.native = true;
    oidcState.createSigninRequest.mockResolvedValue({
      url: "http://localhost:8000/realms/raiji/protocol/openid-connect/auth?client_id=raiji-api&x=1",
    });
    const auth = await load();
    await auth.signIn({ mode: "register" });
    expect(cap.open).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining("/registrations?") }));
  });

  it("web: envia o provedor (Google)", async () => {
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ origin: "http://app.local", assign, search: "" } as never);
    oidcState.createSigninRequest.mockResolvedValue({ url: "http://kc/auth" });
    const auth = await load();
    await auth.signIn({ provider: "google" });
    expect(oidcState.createSigninRequest).toHaveBeenCalledWith(
      expect.objectContaining({ extraQueryParams: { kc_idp_hint: "google" } }),
    );
  });

  it("app nativo: abre a aba do sistema", async () => {
    cap.native = true;
    oidcState.createSigninRequest.mockResolvedValue({ url: "http://kc/auth" });
    const auth = await load();

    await auth.signIn();
    expect(auth.isNativeApp()).toBe(true);
    expect(cap.addListener).toHaveBeenCalledWith("appUrlOpen", expect.any(Function));
    expect(cap.open).toHaveBeenCalledWith(
      expect.objectContaining({ url: "http://kc/auth", toolbarColor: "#EF6C00", presentationStyle: "popover" }),
    );
  });

  it("conclui o login e guarda a sessão", async () => {
    oidcState.processSigninResponse.mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      id_token: "i",
      expires_in: 120,
      profile: { sub: "kc-9", email: "a@b.c", name: "Ana" },
      userState: { returnTo: "/corridas" },
    });
    const auth = await load();

    await expect(auth.completeSignIn("http://x/callback?code=1")).resolves.toBe("/corridas");
    expect(auth.getSession()).toMatchObject({ accessToken: "a", refreshToken: "r", user: { id: "kc-9", email: "a@b.c" } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ accessToken: "a" });
  });

  it("conclui o login sem returnTo e decodificando o id_token", async () => {
    oidcState.processSigninResponse.mockResolvedValue({
      access_token: "a",
      id_token: jwt({ sub: "kc-7", name: "Bia" }),
    });
    const auth = await load();
    await expect(auth.completeSignIn("http://x/callback")).resolves.toBe("/homepage");
    expect(auth.getSession()?.user).toMatchObject({ id: "kc-7", name: "Bia" });
  });

  it("trata o retorno do app nativo, inclusive erros", async () => {
    cap.native = true;
    let appUrlCallback: ((event: { url: string }) => void) | undefined;
    cap.addListener.mockImplementation(async (_event: string, cb: (e: { url: string }) => void) => {
      appUrlCallback = cb;
    });
    oidcState.processSigninResponse.mockResolvedValue({ access_token: "a", profile: { sub: "kc-1" } });
    const auth = await load();

    const errors: Error[] = [];
    auth.onNativeSignInError((e) => errors.push(e));
    await auth.initNativeAuth();

    appUrlCallback!({ url: "https://ignorado" }); // não é o esquema do app
    await new Promise((r) => setTimeout(r, 0));
    expect(cap.close).not.toHaveBeenCalled();

    appUrlCallback!({ url: "com.raiji.app://auth/callback?code=1" });
    await vi.waitFor(() => expect(auth.getSession()?.accessToken).toBe("a"));
    expect(cap.close).toHaveBeenCalled();

    oidcState.processSigninResponse.mockImplementation(() => Promise.reject(new Error("código inválido")));
    appUrlCallback!({ url: "com.raiji.app://auth/callback?code=2" });
    await vi.waitFor(() => expect(errors[0]?.message).toBe("código inválido"));
  });

  it("initNativeAuth resolve na web", async () => {
    const auth = await load();
    await expect(auth.initNativeAuth()).resolves.toBeUndefined();
    expect(cap.addListener).not.toHaveBeenCalled();
  });
});

describe("logout e conta", () => {
  it("sai: limpa a sessão e encerra no Keycloak", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session()));
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const auth = await load();
    await auth.signOut();

    expect(auth.getSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
  });

  it("sair sem sessão não chama o Keycloak", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const auth = await load();
    await auth.signOut();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("abre a página Minha conta (web e app)", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const auth = await load();
    await auth.openAccountPage();
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/realms/raiji/account?referrer=raiji-api"), "_blank", "noopener");

    cap.native = true;
    await auth.openAccountPage();
    expect(cap.open).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining("/account") }));
  });
});
