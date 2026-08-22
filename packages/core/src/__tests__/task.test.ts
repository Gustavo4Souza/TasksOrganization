import { describe, expect, it } from "vitest";
import { TaskStore, createTask } from "../task.js";

describe("createTask", () => {
  it("cria uma tarefa com valores padrão", () => {
    const task = createTask({ title: "Estudar DevOps" });
    expect(task.title).toBe("Estudar DevOps");
    expect(task.scope).toBe("daily");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.id).toBeTruthy();
  });

  it("rejeita título vazio", () => {
    expect(() => createTask({ title: "   " })).toThrow();
  });
});

describe("TaskStore", () => {
  it("adiciona e lista tarefas", () => {
    const store = new TaskStore();
    store.add({ title: "Tarefa diária", scope: "daily" });
    store.add({ title: "Tarefa semanal", scope: "weekly" });

    expect(store.list()).toHaveLength(2);
    expect(store.list({ scope: "weekly" })).toHaveLength(1);
  });

  it("marca tarefa como concluída", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Configurar CI/CD" });

    const updated = store.complete(task.id);
    expect(updated.status).toBe("done");
    expect(store.get(task.id)?.status).toBe("done");
  });

  it("lança erro ao atualizar tarefa inexistente", () => {
    const store = new TaskStore();
    expect(() => store.updateStatus("id-invalido", "done")).toThrow();
  });

  it("remove tarefa", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Remover depois" });
    expect(store.remove(task.id)).toBe(true);
    expect(store.list()).toHaveLength(0);
  });
});
