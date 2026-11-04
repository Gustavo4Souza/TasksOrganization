import { createTask } from "@tasksorg/core";
import { describe, expect, it } from "vitest";
import { resumoDoEscopo, tarefasDaColuna } from "../src/resumo";

describe("resumoDoEscopo", () => {
  it("conta as missões do escopo por status usando o core", () => {
    const tarefas = [
      createTask({ title: "A", scope: "daily" }),
      { ...createTask({ title: "B", scope: "daily" }), status: "done" as const },
      createTask({ title: "C", scope: "weekly" }),
    ];
    expect(resumoDoEscopo(tarefas, "daily")).toEqual({ todo: 1, doing: 0, done: 1 });
  });
});

describe("tarefasDaColuna", () => {
  it("mantém somente as missões do status selecionado", () => {
    const todo = createTask({ title: "Planejar", scope: "daily" });
    const doing = { ...createTask({ title: "Executar", scope: "daily" }), status: "doing" as const };
    const done = { ...createTask({ title: "Entregar", scope: "daily" }), status: "done" as const };

    expect(tarefasDaColuna([todo, doing, done], "doing")).toEqual([doing]);
  });
});
