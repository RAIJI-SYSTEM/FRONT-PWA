import { test, expect } from "@playwright/test";

/**
 * E2E de navegador do FRONT-PWA com login real no Keycloak.
 * Depois do login, valida o início, o histórico e a caixa de mensagens.
 */
test.describe("FRONT-PWA — navegador", () => {
  test("login no Keycloak, início e navegação autenticada", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Viaje e envie,")).toBeVisible();

    await page.getByRole("button", { name: /Entrar com e-mail/i }).click();
    await page.waitForURL(/realms\/raiji\/protocol\/openid-connect\/auth/, { timeout: 30_000 });

    await page.locator("#username").fill("teste");
    await page.locator("#password").fill("teste123");
    await page.locator("#kc-login").click();

    await page.waitForURL(/\/homepage/, { timeout: 30_000 });
    await expect(page.getByText("Motoristas, códigos ou viagens")).toBeVisible();
    await expect(page.getByText("Acontecendo agora")).toBeVisible();

    // A sessão persiste no reload (localStorage/OIDC)
    await page.reload();
    await expect(page.getByText("Motoristas, códigos ou viagens")).toBeVisible();

    for (const path of ["/corridas", "/mural", "/mensagens"]) {
      await page.goto(path);
      await expect(page, `página ${path} deveria continuar autenticada`).not.toHaveURL(/\/login/);
    }
  });
});
