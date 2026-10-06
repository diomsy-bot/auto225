import { defineConfig, devices } from "@playwright/test";

// Parcours de recette (ACC-01 à ACC-09). Lancer après `npm run build` : `npx playwright test`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npx next start -p 3100", url: "http://localhost:3100", reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
});
