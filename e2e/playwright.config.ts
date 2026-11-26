import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const FRONT = process.env.FRONT_URL ?? "http://localhost:3000";
const AUTH_FILE = fileURLToPath(new URL("./.auth/user.json", import.meta.url));

/**
 * E2E do FRONT-PWA.
 *
 * - ui:  navegador real no front, cobrindo login Keycloak e navegação.
 * - api: o BFF do Next e o caminho BFF -> Kong -> monólito/chat.
 *
 * O fluxo de negócio completo (carona + chat) roda na suíte E2E do monólito
 * e do MESSAGE-SERVICE; aqui o foco é a camada que o usuário vê.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: FRONT },
    },
    {
      name: "ui",
      testMatch: /ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: FRONT,
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "pages",
      testMatch: /pages\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: FRONT,
        storageState: AUTH_FILE,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "api",
      testMatch: /api\.spec\.ts/,
      use: {
        baseURL: FRONT,
        extraHTTPHeaders: { Accept: "application/json" },
        trace: "retain-on-failure",
      },
    },
  ],
});
