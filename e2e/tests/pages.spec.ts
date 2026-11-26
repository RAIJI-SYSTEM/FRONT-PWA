import { test, expect } from "@playwright/test";

/**
 * Uma tela = um teste E2E isolado.
 *
 * Valida que a rota renderiza autenticada, não cai no login e não mostra
 * erro de aplicação. A autenticação é compartilhada via auth.setup.ts.
 */
const routes = [
  "/",
  "/login",
  "/auth/callback",
  "/homepage",
  "/corridas",
  "/encomendas",
  "/mais",
  "/mural",
  "/notificacoes",
  "/perfil",
  "/configuracoes",
  "/recompensas",
  "/buscar",
  "/viagem/nova",
  "/viagem/busca",
  "/viagem/pedido",
  "/viagem/reserva",
  "/viagem/pagamento",
  "/viagem/pagamento/status",
  "/encomenda",
  "/encomenda/nova",
  "/encomenda/produto",
  "/encomenda/pagamento",
  "/encomenda/pagamento/status",
  "/mensagens",
  "/mensagens/conversa",
  "/motorista",
  "/motorista/cadastro",
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
  "/empresa/detalhe",
  "/empresa/frete",
  "/empresa/frete/novo",
  "/admin/repasses",
  "/privacidade",
  "/termos",
];

test.describe("FRONT-PWA — todas as telas", () => {
  for (const route of routes) {
    test(`tela ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.status() ?? 200, `status de ${route}`).toBeLessThan(500);
      await expect(page, `${route} não deve cair no login`).not.toHaveURL(/\/login/);
      await expect(page.locator("body"), `erro visível em ${route}`).not.toContainText(
        /Application error|Internal Server Error|Unhandled Runtime Error/i,
      );
    });
  }
});
