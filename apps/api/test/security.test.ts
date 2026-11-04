import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, hashToken, verifyPassword } from "../src/security.js";

describe("segurança da API", () => {
  it("protege senhas com salt e scrypt", async () => {
    const first = await hashPassword("senha-segura");
    const second = await hashPassword("senha-segura");
    expect(first).not.toBe(second);
    await expect(verifyPassword("senha-segura", first)).resolves.toBe(true);
    await expect(verifyPassword("senha-errada", first)).resolves.toBe(false);
  });

  it("gera tokens aleatórios e armazena somente o hash", () => {
    const session = createSessionToken();
    expect(session.token).not.toBe(session.hash);
    expect(session.hash).toBe(hashToken(session.token));
    expect(session.hash).toHaveLength(64);
  });
});
