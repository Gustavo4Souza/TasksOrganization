import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
  },
});
