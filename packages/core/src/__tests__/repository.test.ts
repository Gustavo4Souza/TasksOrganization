import { describe, expect, it } from "vitest";
import {
  type KeyValueStorage,
  type TextFileSystem,
  TaskRepositoryError,
  createInMemoryTaskRepository,
  createJsonFileTaskRepository,
  createLocalStorageTaskRepository,
  normalizeTask,
  parseStoredTasks,
} from "../repository.js";
import { TaskStore, createTask } from "../task.js";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function fakeFs(files: Record<string, string> = {}): TextFileSystem & { files: Record<string, string> } {
  return {
    files,
    async readFile(path) {
      const content = files[path];
      if (content === undefined) throw Object.assign(new Error("not found"), { code: "ENOENT" });
      return content;
    },
    async writeFile(path, data) {
      files[path] = data;
    },
  };
}

describe("createLocalStorageTaskRepository", () => {
  it("começa vazio quando não há nada salvo", async () => {
    const repo = createLocalStorageTaskRepository(fakeStorage());
    expect(await repo.list()).toEqual([]);
  });

  it("salva, lista e remove tarefas", async () => {
    const storage = fakeStorage();
    const repo = createLocalStorageTaskRepository(storage, "chave");
    const a = createTask({ title: "A" });
    const b = createTask({ title: "B" });

    await repo.save(a);
    await repo.save(b);
    await repo.remove(a.id);

    expect((await repo.list()).map((t) => t.title)).toEqual(["B"]);
    expect(JSON.parse(storage.data.chave!)).toMatchObject({ version: 1, tasks: [{ title: "B" }] });
  });

  it("save com o mesmo id substitui a tarefa", async () => {
    const repo = createLocalStorageTaskRepository(fakeStorage());
    const task = createTask({ title: "Antes" });
    await repo.save(task);
    await repo.save({ ...task, title: "Depois" });
    expect((await repo.list()).map((t) => t.title)).toEqual(["Depois"]);
  });

  it("os dados sobrevivem a recarregar a página (novo repositório, mesmo storage)", async () => {
    const storage = fakeStorage();
    const store = new TaskStore();
    const task = store.add({ title: "Persistir" });
    await createLocalStorageTaskRepository(storage).save(store.complete(task.id));

    const reloaded = new TaskStore(await createLocalStorageTaskRepository(storage).list());
    expect(reloaded.get(task.id)).toMatchObject({ title: "Persistir", status: "done", pomodoros: 0 });
  });

  it("acusa dados corrompidos com TaskRepositoryError", async () => {
    const repo = createLocalStorageTaskRepository(fakeStorage({ "tasksorg:tasks": "{não é json" }));
    await expect(repo.list()).rejects.toBeInstanceOf(TaskRepositoryError);
  });
});

describe("createJsonFileTaskRepository", () => {
  it("primeira execução (arquivo não existe) começa vazio", async () => {
    const repo = createJsonFileTaskRepository(fakeFs(), "/dados/tasks.json");
    expect(await repo.list()).toEqual([]);
  });

  it("grava o arquivo JSON e lê de volta", async () => {
    const fs = fakeFs();
    const task = createTask({ title: "No disco", priority: "high" });
    await createJsonFileTaskRepository(fs, "/dados/tasks.json").save(task);

    const again = createJsonFileTaskRepository(fs, "/dados/tasks.json");
    expect(await again.list()).toEqual([task]);
  });

  it("propaga erros de leitura que não são 'arquivo não existe'", async () => {
    const fs: TextFileSystem = {
      readFile: async () => {
        throw Object.assign(new Error("sem permissão"), { code: "EACCES" });
      },
      writeFile: async () => undefined,
    };
    await expect(createJsonFileTaskRepository(fs, "/x.json").list()).rejects.toThrow("sem permissão");
  });

  it("se a gravação falhar, a próxima leitura volta ao que está no disco", async () => {
    const fs = fakeFs();
    const repo = createJsonFileTaskRepository(fs, "/t.json");
    await repo.save(createTask({ title: "Gravada" }));

    fs.writeFile = async () => {
      throw new Error("disco cheio");
    };
    await expect(repo.save(createTask({ title: "Perdida" }))).rejects.toThrow("disco cheio");
    expect((await repo.list()).map((t) => t.title)).toEqual(["Gravada"]);
  });

  it("gravações seguidas terminam na ordem em que foram pedidas", async () => {
    const fs = fakeFs();
    const repo = createJsonFileTaskRepository(fs, "/t.json");
    const task = createTask({ title: "v1" });
    await Promise.all([repo.save(task), repo.save({ ...task, title: "v2" }), repo.save({ ...task, title: "v3" })]);
    expect(parseStoredTasks(fs.files["/t.json"]!)[0]!.title).toBe("v3");
  });
});

describe("createInMemoryTaskRepository", () => {
  it("começa com as tarefas iniciais", async () => {
    const task = createTask({ title: "Inicial" });
    expect(await createInMemoryTaskRepository([task]).list()).toEqual([task]);
  });
});

describe("normalizeTask / parseStoredTasks", () => {
  it("completa tarefas salvas antes de existir pomodoros e completedAt", () => {
    const old = { id: "1", title: "Antiga", scope: "weekly", status: "done", priority: "low", createdAt: "2026-08-21T00:00:00.000Z", updatedAt: "2026-08-21T00:00:00.000Z" };
    expect(normalizeTask(old)).toMatchObject({ id: "1", pomodoros: 0, completedAt: undefined, scope: "weekly", status: "done" });
  });

  it("troca valores inválidos pelos padrões", () => {
    expect(normalizeTask({ id: "1", title: "x", scope: "mensal", status: "?", priority: 9, pomodoros: -3 })).toMatchObject({
      scope: "daily",
      status: "todo",
      priority: "medium",
      pomodoros: 0,
    });
  });

  it("descarta completedAt de tarefa que não está concluída", () => {
    expect(normalizeTask({ id: "1", title: "x", status: "todo", completedAt: "2026-01-01" }).completedAt).toBeUndefined();
  });

  it("rejeita tarefa sem id ou título", () => {
    expect(() => normalizeTask({ title: "sem id" })).toThrow(TaskRepositoryError);
    expect(() => normalizeTask(null)).toThrow(TaskRepositoryError);
  });

  it("aceita lista solta, sem o envelope { version, tasks }", () => {
    expect(parseStoredTasks(JSON.stringify([{ id: "1", title: "solta" }]))).toHaveLength(1);
  });

  it("rejeita JSON sem lista de tarefas", () => {
    expect(() => parseStoredTasks(JSON.stringify({ version: 1 }))).toThrow(TaskRepositoryError);
  });
});
