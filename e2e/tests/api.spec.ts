import { test, expect } from "@playwright/test";
import { auth, getToken } from "../helpers/raiji";

/**
 * E2E de sistema via BFF do FRONT-PWA:
 * navegador/app -> Next /api -> Kong -> monólito/chat.
 */
test.describe("FRONT-PWA — BFF e APIs", () => {
  test("BFF encaminha autenticação para o monólito e para o chat", async ({ request }) => {
    const token = await getToken(request);

    const me = await request.get("/api/raiji/me", { headers: auth(token) });
    expect(me.status(), await me.text()).toBe(200);
    expect(await me.json()).toMatchObject({ email: "teste@raiji.com" });

    const chat = await request.get("/api/chat/users/me", { headers: auth(token) });
    expect(chat.status(), await chat.text()).toBe(200);
    expect(await chat.json()).toHaveProperty("keycloakId");
  });

  test("BFF bloqueia chamadas sem token", async ({ request }) => {
    expect((await request.get("/api/raiji/me")).status()).toBe(401);
    expect((await request.get("/api/chat/users/me")).status()).toBe(401);
  });
});
