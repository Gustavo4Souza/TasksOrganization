// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm } from "../app/auth/auth-form";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Autenticação", () => {
  it("mostra login e permite navegar para o cadastro", async () => {
    render(<AuthForm mode="login" />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("castelo"));
    expect(screen.getByRole("heading", { name: "Continue sua missão" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Criar conta" }).getAttribute("href")).toBe("/cadastro");
    expect(screen.getByLabelText("E-mail").getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText("Senha").getAttribute("autocomplete")).toBe("current-password");
  });

  it("valida a confirmação de senha no cadastro", () => {
    render(<AuthForm mode="register" />);
    fireEvent.change(screen.getByLabelText("Nome do aventureiro"), { target: { value: "Higor" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "higor@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "outra-senha" } });
    fireEvent.submit(screen.getByRole("button", { name: "Criar conta" }).closest("form")!);
    expect(screen.getByRole("alert").textContent).toContain("As senhas precisam ser iguais");
  });

  it("exibe erro amigável enquanto a API não está configurada", () => {
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "higor@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);
    expect(screen.getByRole("alert").textContent).toContain("serviço está indisponível");
  });

  it("bloqueia o formulário e mostra o estado de carregamento durante a requisição", async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    render(<AuthForm mode="login" apiBaseUrl="https://api.example.test" />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "higor@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);
    expect(await screen.findByRole("status")).toHaveProperty("textContent", expect.stringContaining("Salvando progresso"));
    expect((screen.getByRole("button", { name: "Aguarde..." }) as HTMLButtonElement).disabled).toBe(true);
    finish(new Response(JSON.stringify({ message: "Falha temporária" }), { status: 503, headers: { "content-type": "application/json" } }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Falha temporária"));
  });
});
