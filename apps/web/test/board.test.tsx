// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HomePage from "../app/page";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});

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
});
