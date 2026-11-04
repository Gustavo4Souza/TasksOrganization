import { describe, expect, it, vi } from "vitest";
import { authenticate, revokeSession } from "../src/api";

describe("autenticação mobile", () => {
  it("devolve a sessão criada pela API", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ token: "token", user: { id: "u1", name: "Higor", email: "h@test.dev" } }), { status: 200 }));
    await expect(authenticate("login", { email: "h@test.dev", password: "segredo123" }, fetcher)).resolves.toMatchObject({ token: "token" });
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/auth/login"), expect.objectContaining({ method: "POST" }));
  });

  it("mostra o erro validado pela API", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "E-mail ou senha inválidos." }), { status: 401 }));
    await expect(authenticate("login", { email: "h@test.dev", password: "errada" }, fetcher)).rejects.toThrow("E-mail ou senha inválidos.");
  });

  it("revoga o token ao sair", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    await revokeSession("token", fetcher);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/auth/logout"), expect.objectContaining({ headers: { authorization: "Bearer token" } }));
  });
});
