import { createTask } from "@tasksorg/core";
import { describe, expect, it } from "vitest";
import { resumoDoEscopo } from "../src/resumo";

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
