import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("configuração da API", () => {
  it("exige banco e normaliza origens", () => {
    expect(() => loadConfig({})).toThrow("DATABASE_URL");
    expect(loadConfig({ DATABASE_URL: "postgres://db", ALLOWED_ORIGINS: "https://web.test, http://localhost:3000" })).toMatchObject({
      databaseUrl: "postgres://db",
      allowedOrigins: ["https://web.test", "http://localhost:3000"],
      port: 3001,
      secureCookies: false,
    });
  });
});
