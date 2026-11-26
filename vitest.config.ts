import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const stub = (name: string) => fileURLToPath(new URL(`./test/stubs/${name}`, import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": stub("server-only.ts"),
      "next/link": stub("next-link.tsx"),
      "next/navigation": stub("next-navigation.ts"),
      "next/script": stub("next-script.tsx"),
      "next/image": stub("next-image.tsx"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      // Escopo: camada de lógica/serviços + componentes compartilhados.
      // src/app (rotas Next) e src/features (telas) entram no e2e/load-tests.
      include: [
        "src/utils/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/server/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
      ],
      exclude: ["src/services/backend/types.ts", "**/*.d.ts"],
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 65,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./test/setup.ts"],
          include: ["test/ui/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
