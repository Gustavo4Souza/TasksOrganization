import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/__tests__/**"],
      reporter: ["text", "lcov"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
