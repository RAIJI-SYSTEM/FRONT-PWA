import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Entrar com e-mail/i }).click();
  await page.waitForURL(/realms\/raiji\/protocol\/openid-connect\/auth/, { timeout: 30_000 });
  await page.locator("#username").fill("teste");
  await page.locator("#password").fill("teste123");
  await page.locator("#kc-login").click();
  await page.waitForURL(/\/homepage/, { timeout: 30_000 });
}

/**
 * Smoke de todas as telas estáticas do PWA autenticado.
 * Valida que cada rota renderiza sem erro de aplicação e sem cair no login.
 */
test.describe("FRONT-PWA — todas as telas", () => {
  test("rotas principais renderizam autenticadas", async ({ page }) => {
    test.setTimeout(180_000);
    await login(page);

    const routes = [
      "/homepage",
      "/corridas",
      "/encomendas",
      "/mais",
      "/mural",
      "/notificacoes",
      "/perfil",
      "/configuracoes",
      "/recompensas",
      "/viagem/nova",
      "/viagem/busca",
      "/encomenda/nova",
      "/encomenda",
      "/mensagens",
      "/motorista",
      "/motorista/pedidos",
      "/motorista/fretes",
      "/motorista/rotas",
      "/motorista/rotas/nova",
      "/motorista/rotas/gerenciar",
      "/motorista/perfil",
      "/motorista/repasses",
      "/motorista/mensagens",
      "/motorista/notificacoes",
      "/motorista/mais",
      "/empresa",
      "/empresa/frete",
      "/admin/repasses",
      "/",
      "/auth/callback",
      "/buscar",
      "/empresa/detalhe",
      "/empresa/frete/novo",
      "/encomenda/pagamento",
      "/encomenda/pagamento/status",
      "/encomenda/produto",
      "/mensagens/conversa",
      "/motorista/cadastro",
      "/privacidade",
      "/termos",
      "/viagem/pagamento",
      "/viagem/pagamento/status",
      "/viagem/pedido",
      "/viagem/reserva",
    ];

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status() ?? 200, `status de ${route}`).toBeLessThan(500);
      await expect(page, `rota ${route} não deve cair no login`).not.toHaveURL(/\/login/);
      await expect(page.locator("body"), `erro visível em ${route}`).not.toContainText(
        /Application error|Internal Server Error|Unhandled Runtime Error/i,
      );
    }
  });
});
