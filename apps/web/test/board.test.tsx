// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HomePage from "../app/page";
import { createTask, serializeTasks } from "@tasksorg/core";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Quadro", () => {
  it("limita e normaliza títulos nas entradas do usuário", async () => {
    const task = createTask({ title: "Editar depois" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    render(<HomePage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Criar" }) as HTMLButtonElement).disabled).toBe(false));
    const createInput = screen.getByRole("textbox", { name: "Nova missão" }) as HTMLInputElement;
    expect(createInput.maxLength).toBe(160);
    fireEvent.change(createInput, { target: { value: "  Título normalizado  " } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByRole("heading", { name: "Título normalizado" })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect((screen.getByRole("textbox", { name: "Editar missão" }) as HTMLInputElement).maxLength).toBe(160);
  });

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

  it("restaura o tema salvo ao abrir o Quadro", async () => {
    window.localStorage.setItem("tasksorg:theme", "pergaminho");
    render(<HomePage />);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("pergaminho"));
    expect(window.localStorage.getItem("tasksorg:theme")).toBe("pergaminho");
  });

  it("usa os atalhos do Quadro fora dos campos de edição", async () => {
    render(<HomePage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Criar" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.keyDown(window, { key: "2", code: "Digit2" });
    expect(screen.getByRole("tab", { name: /Semana/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(window, { key: "3", code: "Digit3" });
    expect(screen.getByRole("tab", { name: /Ano/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(window, { key: "1", code: "Digit1" });
    expect(screen.getByRole("tab", { name: /Hoje/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByRole("button", { name: "Pausar" })).toBeTruthy();
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "n", code: "KeyN" });
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Nova missão" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Nova missão" }), { key: "2", code: "Digit2" });
    expect(screen.getByRole("tab", { name: /Hoje/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("permite editar e excluir uma missão com confirmação", async () => {
    const task = createTask({ title: "Título antigo" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<HomePage />);
    expect(await screen.findByRole("heading", { name: "Título antigo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Editar missão" }), { target: { value: "Título novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("heading", { name: "Título novo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Título novo" })).toBeTruthy();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Título novo" })).toBeNull());
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("tasksorg:tasks") ?? "{}").tasks).toHaveLength(0));
  });

  it("oferece Recuar e Reabrir como alternativas ao arrastar", async () => {
    const task = createTask({ title: "Mover por botão" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    render(<HomePage />);
    expect(await screen.findByRole("heading", { name: "Mover por botão" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Batalhar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Recuar" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Recuar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Batalhar" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Reabrir" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Reabrir" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Batalhar" })).toBeTruthy());
  });

  it("liga o PomodoroHUD à missão em batalha", async () => {
    const task = createTask({ title: "Foco no HUD" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    render(<HomePage />);
    fireEvent.click(await screen.findByRole("button", { name: "Batalhar" }));
    await waitFor(() => expect(screen.getByText("Em batalha:")).toBeTruthy());
    expect(screen.getByText("Foco no HUD", { selector: ".px-pomo-battle strong" })).toBeTruthy();
    expect(screen.getByRole("timer", { name: /restantes de Foco/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pular fase" })).toBeTruthy();
  });

  it("move uma missão ao soltar o cartão em outra coluna", async () => {
    const task = createTask({ title: "Arrastar missão" });
    window.localStorage.setItem("tasksorg:tasks", serializeTasks([task]));
    render(<HomePage />);
    const card = (await screen.findByRole("heading", { name: "Arrastar missão" })).closest(".board-card");
    const target = screen.getByRole("heading", { name: "Em batalha" }).closest("section");
    expect(card).toBeTruthy();
    expect(target).toBeTruthy();
    const data = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
    };
    fireEvent.dragStart(card!, { dataTransfer });
    fireEvent.dragOver(target!, { dataTransfer });
    fireEvent.drop(target!, { dataTransfer });
    await waitFor(() => expect(within(target!).getByRole("heading", { name: "Arrastar missão" })).toBeTruthy());
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem("tasksorg:tasks") ?? "{}").tasks?.[0]?.status).toBe("doing"));
  });

  it("descreve os dias e meses do mapa para leitores de tela", async () => {
    render(<HomePage />);
    await waitFor(() => expect((screen.getByRole("button", { name: "Criar" }) as HTMLButtonElement).disabled).toBe(false));
    expect(within(screen.getByRole("list", { name: "Progresso da semana" })).getAllByRole("listitem")).toHaveLength(7);
    fireEvent.click(screen.getByRole("tab", { name: /Ano/ }));
    expect(within(screen.getByRole("list", { name: "Progresso do ano" })).getAllByRole("listitem")).toHaveLength(12);
  });
});
