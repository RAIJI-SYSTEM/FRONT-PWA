import { mkdirSync } from "node:fs";
import { test as setup } from "@playwright/test";

/**
 * Autentica uma única vez e salva a sessão (localStorage do OIDC) para que
 * cada tela seja um teste isolado, sem repetir o login 45 vezes.
 */
setup("autenticar no Keycloak", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Entrar com e-mail/i }).click();
  await page.waitForURL(/realms\/raiji\/protocol\/openid-connect\/auth/, { timeout: 30_000 });

  await page.locator("#username").fill("teste");
  await page.locator("#password").fill("teste123");
  await page.locator("#kc-login").click();

  await page.waitForURL(/\/homepage/, { timeout: 30_000 });

  mkdirSync(".auth", { recursive: true });
  await page.context().storageState({ path: ".auth/user.json" });
});
