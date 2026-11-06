import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const webOrigin = `http://localhost:${PORT}`;
const apiUrl = process.env.E2E_API_URL ? new URL(process.env.E2E_API_URL) : undefined;

// Com E2E_API_URL definido, o Playwright sobe a API (já buildada) para o teste de
// sincronização. Se ela já estiver rodando, como no CI, reaproveita a instância.
// A API precisa de DATABASE_URL apontando para um PostgreSQL acessível.
const apiServer = apiUrl
  ? [{
      command: "node ../api/dist/server.js",
      url: new URL("/ready", apiUrl).toString(),
      reuseExistingServer: true,
      timeout: 60_000,
      env: {
        HOST: apiUrl.hostname === "localhost" ? "127.0.0.1" : apiUrl.hostname,
        PORT: apiUrl.port || "3001",
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? webOrigin,
      },
    }]
  : [];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: webOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    ...apiServer,
    {
      command: `pnpm exec next start -p ${PORT}`,
      url: webOrigin,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
