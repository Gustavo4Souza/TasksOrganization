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
      trustProxy: false,
    });
  });

  it("lê TRUST_PROXY para o rate limit usar o IP real atrás do proxy", () => {
    const base = { DATABASE_URL: "postgres://db" };
    expect(loadConfig({ ...base, TRUST_PROXY: "true" }).trustProxy).toBe(true);
    expect(loadConfig({ ...base, TRUST_PROXY: "1" }).trustProxy).toBe(1);
    expect(loadConfig({ ...base, TRUST_PROXY: "false" }).trustProxy).toBe(false);
    expect(() => loadConfig({ ...base, TRUST_PROXY: "talvez" })).toThrow("TRUST_PROXY");
  });
});
