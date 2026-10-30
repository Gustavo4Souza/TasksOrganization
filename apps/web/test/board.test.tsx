// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HomePage from "../app/page";
import { createTask, serializeTasks } from "@tasksorg/core";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(cleanup);

describe("Quadro", () => {
  it("cria, inicia batalha, conclui e restaura a missão salva", async () => {
    const view = render(<HomePage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Criar" }) as HTMLButtonElement).disabled).toBe(false));
    const input = screen.getByRole("textbox", { name: "Nova missão" });
    fireEvent.change(input, { target: { value: "Preparar apresentação" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByRole("heading", { name: "Preparar apresentação" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Batalhar" }));
    await waitFor(() => expect(within(screen.getByRole("heading", { name: "Em batalha" }).closest("section")!).getByRole("heading", { name: "Preparar apresentação" })).toBeTruthy());
    fireEvent.click(within(screen.getByRole("heading", { name: "Em batalha" }).closest("section")!).getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(within(screen.getByRole("heading", { name: "Conquistas" }).closest("section")!).getByRole("heading", { name: "Preparar apresentação" })).toBeTruthy());
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("tasksorg:tasks") ?? "{}").tasks?.[0]?.status).toBe("done"));
    view.unmount();
    render(<HomePage />);
    await waitFor(() => expect(within(screen.getByRole("heading", { name: "Conquistas" }).closest("section")!).getByRole("heading", { name: "Preparar apresentação" })).toBeTruthy());
  });

  it("mostra missões excedentes e permite abrir a lista completa", async () => {
    const tasks = Array.from({ length: 12 }, (_, index) => createTask({ title: `Missão ${index + 1}` }));
    window.localStorage.setItem("tasksorg:tasks", serializeTasks(tasks));
    render(<HomePage />);
    expect(await screen.findByText("+1 missões")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Missão 12" })).toBeNull();
    fireEvent.click(screen.getByText("+1 missões"));
    fireEvent.click(screen.getByRole("button", { name: "Missão 12" }));
    expect(await screen.findByRole("heading", { name: "Missão 12" })).toBeTruthy();
  });

  it("alterna escopo e tema sem perder as preferências", async () => {
    const task = createTask({ title: "Planejar semana", scope: "weekly" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    render(<HomePage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Criar" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("tab", { name: /Semana/ }));
    expect(await screen.findByRole("heading", { name: "Planejar semana" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tema Pergaminho" }));
    expect(document.documentElement.dataset.theme).toBe("pergaminho");
    expect(window.localStorage.getItem("tasksorg:theme")).toBe("pergaminho");
  });

  it("usa o tema claro do sistema na primeira visita", async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() });
    render(<HomePage />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("pergaminho"));
    expect(window.localStorage.getItem("tasksorg:theme")).toBe("pergaminho");
  });
});
