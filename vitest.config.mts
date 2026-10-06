import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: { include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"], fileParallelism: false, testTimeout: 20000 },
});
