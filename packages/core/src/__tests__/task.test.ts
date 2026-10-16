import { describe, expect, it } from "vitest";
import { TaskStore, compareByPriority, createTask } from "../task.js";

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

describe("pomodoros e completedAt (T1.1.1)", () => {
  it("tarefa nova começa com 0 pomodoros e sem completedAt", () => {
    const task = createTask({ title: "Nova" });
    expect(task.pomodoros).toBe(0);
    expect(task.completedAt).toBeUndefined();
  });

  it("addPomodoro credita um foco na tarefa", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Focar" });
    store.addPomodoro(task.id);
    expect(store.addPomodoro(task.id).pomodoros).toBe(2);
  });

  it("concluir registra completedAt e reabrir apaga", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Concluir" });

    const done = store.complete(task.id);
    expect(done.completedAt).toBeDefined();
    expect(Number.isNaN(Date.parse(done.completedAt!))).toBe(false);

    expect(store.updateStatus(task.id, "todo").completedAt).toBeUndefined();
  });

  it("concluir de novo mantém a data da primeira conclusão", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Concluir duas vezes" });
    const first = store.complete(task.id).completedAt;
    expect(store.complete(task.id).completedAt).toBe(first);
  });
});

describe("uma única missão em batalha (T1.1.2)", () => {
  it("startBattle coloca a tarefa em doing", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Batalhar" });
    const { started, paused } = store.startBattle(task.id);
    expect(started.status).toBe("doing");
    expect(paused).toBeUndefined();
    expect(store.getBattle()?.id).toBe(task.id);
  });

  it("a missão anterior volta para todo e é devolvida em paused", () => {
    const store = new TaskStore();
    const a = store.add({ title: "A" });
    const b = store.add({ title: "B", scope: "weekly" });
    store.startBattle(a.id);

    const { started, paused } = store.startBattle(b.id);
    expect(started.id).toBe(b.id);
    expect(paused?.id).toBe(a.id);
    expect(store.get(a.id)?.status).toBe("todo");
    expect(store.list({ status: "doing" })).toHaveLength(1);
  });

  it("updateStatus para doing segue a mesma regra", () => {
    const store = new TaskStore();
    const a = store.add({ title: "A" });
    const b = store.add({ title: "B" });
    store.updateStatus(a.id, "doing");
    store.updateStatus(b.id, "doing");
    expect(store.get(a.id)?.status).toBe("todo");
    expect(store.getBattle()?.id).toBe(b.id);
  });

  it("batalhar de novo na mesma tarefa não pausa nada", () => {
    const store = new TaskStore();
    const a = store.add({ title: "A" });
    store.startBattle(a.id);
    expect(store.startBattle(a.id).paused).toBeUndefined();
  });

  it("voltar uma tarefa concluída para batalha apaga o completedAt", () => {
    const store = new TaskStore();
    const a = store.add({ title: "A" });
    store.complete(a.id);
    expect(store.startBattle(a.id).started.completedAt).toBeUndefined();
  });

  it("lança erro ao batalhar tarefa inexistente", () => {
    expect(() => new TaskStore().startBattle("nao-existe")).toThrow();
  });
});

describe("update e ordenação por prioridade (T1.1.3)", () => {
  it("edita título, prioridade, escopo e prazo", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Rascunho" });
    const updated = store.update(task.id, { title: "  Final  ", priority: "high", scope: "yearly", dueDate: "2026-12-01" });
    expect(updated).toMatchObject({ title: "Final", priority: "high", scope: "yearly", dueDate: "2026-12-01", status: "todo" });
  });

  it("rejeita título vazio na edição e não altera a tarefa", () => {
    const store = new TaskStore();
    const task = store.add({ title: "Original" });
    expect(() => store.update(task.id, { title: "  " })).toThrow();
    expect(store.get(task.id)?.title).toBe("Original");
  });

  it("lança erro ao editar tarefa inexistente", () => {
    expect(() => new TaskStore().update("nao-existe", { title: "x" })).toThrow();
  });

  it("lista por prioridade: alta, média, baixa; empate pela ordem de criação", () => {
    const store = new TaskStore([
      { ...createTask({ title: "baixa", priority: "low" }), createdAt: "2026-01-01T00:00:00.000Z" },
      { ...createTask({ title: "alta 2", priority: "high" }), createdAt: "2026-01-03T00:00:00.000Z" },
      { ...createTask({ title: "media", priority: "medium" }), createdAt: "2026-01-02T00:00:00.000Z" },
      { ...createTask({ title: "alta 1", priority: "high" }), createdAt: "2026-01-02T00:00:00.000Z" },
    ]);
    expect(store.list({ sort: "priority" }).map((t) => t.title)).toEqual(["alta 1", "alta 2", "media", "baixa"]);
  });

  it("compareByPriority funciona com Array.sort", () => {
    const tasks = [createTask({ title: "b", priority: "low" }), createTask({ title: "a", priority: "high" })];
    expect(tasks.sort(compareByPriority)[0]!.title).toBe("a");
  });
});
