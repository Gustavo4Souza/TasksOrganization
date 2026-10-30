// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createTask, serializeTasks } from "@tasksorg/core";
import FocusPage from "../app/foco/page";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(cleanup);

describe("Modo foco", () => {
  it("usa o tema claro do sistema na primeira visita e mostra as próximas três missões", async () => {
    const tasks = Array.from({ length: 4 }, (_, index) => createTask({ title: `Próxima ${index + 1}` }));
    window.localStorage.setItem("tasksorg:tasks", serializeTasks(tasks));
    render(<FocusPage />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("pergaminho"));
    expect(window.localStorage.getItem("tasksorg:theme")).toBe("pergaminho");
    expect(await screen.findByText("Próxima 1")).toBeTruthy();
    expect(screen.getByText("Próxima 2")).toBeTruthy();
    expect(screen.getByText("Próxima 3")).toBeTruthy();
    expect(screen.queryByText("Próxima 4")).toBeNull();
  });

  it("aciona o relógio por Espaço sem interceptar atalhos do navegador ou controles", async () => {
    render(<FocusPage />);
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    fireEvent.keyDown(window, { key: " ", code: "Space", ctrlKey: true });
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("checkbox", { name: "Som 8-bit" }), { key: " ", code: "Space" });
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeTruthy();
  });
});
