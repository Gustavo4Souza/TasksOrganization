import { describe, expect, it, vi } from "vitest";
import {
  createHttpTaskRepository,
  createOfflineTaskRepository,
  migrateTasksToRepository,
  type KeyValueStorage,
  type TaskRepository,
  type TextFileSystem,
  TaskRepositoryError,
  createInMemoryTaskRepository,
  createJsonFileTaskRepository,
  createLocalStorageTaskRepository,
  normalizeTask,
  parseStoredTasks,
} from "../repository.js";
import { TaskStore, createTask, type Task } from "../task.js";

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

describe("createHttpTaskRepository", () => {
  it("lista e normaliza tarefas recebidas da API", async () => {
    const task = createTask({ title: "Sincronizada" });
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ tasks: [task] }) }));
    const repo = createHttpTaskRepository({ baseUrl: "https://api.example.test/", fetch });

    expect(await repo.list()).toEqual([task]);
    expect(fetch).toHaveBeenCalledWith("https://api.example.test/tasks", expect.objectContaining({ credentials: "include" }));
  });

  it("salva e remove usando o contrato HTTP e token opcional", async () => {
    const task = createTask({ title: "Enviar" });
    const fetch = vi.fn(async () => ({ ok: true, status: 204, json: async () => ({}) }));
    const repo = createHttpTaskRepository({ baseUrl: "https://api.example.test", fetch, getToken: () => "token-mobile" });

    await repo.save(task);
    await repo.remove(task.id);

    expect(fetch).toHaveBeenNthCalledWith(1, `https://api.example.test/tasks/${task.id}`, expect.objectContaining({
      method: "PUT",
      body: JSON.stringify(task),
      headers: expect.objectContaining({ authorization: "Bearer token-mobile", "content-type": "application/json" }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, `https://api.example.test/tasks/${task.id}`, expect.objectContaining({ method: "DELETE" }));
  });

  it("converte falhas de rede e respostas inválidas em erro de repositório", async () => {
    const networkRepo = createHttpTaskRepository({ baseUrl: "https://api.example.test", fetch: async () => { throw new Error("offline"); } });
    await expect(networkRepo.list()).rejects.toThrow(TaskRepositoryError);

    const rejectedRepo = createHttpTaskRepository({ baseUrl: "https://api.example.test", fetch: async () => ({ ok: false, status: 401, json: async () => ({}) }) });
    await expect(rejectedRepo.list()).rejects.toThrow("401");
  });
});

describe("createOfflineTaskRepository", () => {
  it("ignora uma fila persistida corrompida ou com operações inválidas", () => {
    const invalidJson = createOfflineTaskRepository({
      local: createInMemoryTaskRepository(),
      remote: createInMemoryTaskRepository(),
      storage: fakeStorage({ "tasksorg:sync-queue": "{inválido" }),
    });
    expect(invalidJson.pendingCount()).toBe(0);

    const invalidOperations = createOfflineTaskRepository({
      local: createInMemoryTaskRepository(),
      remote: createInMemoryTaskRepository(),
      storage: fakeStorage({ "tasksorg:sync-queue": JSON.stringify([null, { type: "remove" }, { type: "save", task: {} }, { type: "desconhecida" }]) }),
    });
    expect(invalidOperations.pendingCount()).toBe(0);
  });

  it("mantém a alteração local e enfileira enquanto a API está offline", async () => {
    const storage = fakeStorage();
    const local = createInMemoryTaskRepository();
    const remote: TaskRepository = { list: async () => { throw new Error("offline"); }, save: async () => { throw new Error("offline"); }, remove: async () => { throw new Error("offline"); } };
    const repo = createOfflineTaskRepository({ local, remote, storage });
    const task = createTask({ title: "Sem rede" });
    await repo.save(task);
    expect(await repo.list()).toEqual([task]);
    expect(repo.pendingCount()).toBe(1);
  });

  it("envia a fila ao reconectar e atualiza o cache", async () => {
    const storage = fakeStorage();
    const local = createInMemoryTaskRepository();
    let online = false;
    const server = new Map<string, Task>();
    const remote: TaskRepository = {
      list: async () => { if (!online) throw new Error("offline"); return [...server.values()]; },
      save: async (task) => { if (!online) throw new Error("offline"); server.set(task.id, task); },
      remove: async (id) => { if (!online) throw new Error("offline"); server.delete(id); },
    };
    const repo = createOfflineTaskRepository({ local, remote, storage });
    const task = createTask({ title: "Fila" });
    await repo.save(task);
    online = true;
    expect(await repo.sync()).toEqual([task]);
    expect(repo.pendingCount()).toBe(0);
  });

  it("preserva só a última operação pendente de cada missão", async () => {
    const storage = fakeStorage();
    const local = createInMemoryTaskRepository();
    const remote: TaskRepository = { list: async () => { throw new Error("offline"); }, save: async () => { throw new Error("offline"); }, remove: async () => { throw new Error("offline"); } };
    const repo = createOfflineTaskRepository({ local, remote, storage });
    const task = createTask({ title: "Remover" });
    await repo.save(task);
    await repo.remove(task.id);
    expect(repo.pendingCount()).toBe(1);
    expect(JSON.parse(storage.getItem("tasksorg:sync-queue")!)[0]).toEqual({ type: "remove", id: task.id });
  });

  it("confirma salvamento e remoção online sem deixar operações na fila", async () => {
    const storage = fakeStorage();
    const local = createInMemoryTaskRepository();
    const remote = createInMemoryTaskRepository();
    const repo = createOfflineTaskRepository({ local, remote, storage, queueKey: "fila-personalizada" });
    const task = createTask({ title: "Online" });

    await repo.save(task);
    expect(await remote.list()).toEqual([task]);
    await repo.remove(task.id);

    expect(await remote.list()).toEqual([]);
    expect(repo.pendingCount()).toBe(0);
    expect(JSON.parse(storage.getItem("fila-personalizada")!)).toEqual([]);
  });

  it("reconcilia o cache local removendo uma missão ausente no servidor", async () => {
    const obsolete = createTask({ title: "Obsoleta" });
    const current = createTask({ title: "Atual" });
    const local = createInMemoryTaskRepository([obsolete]);
    const remote = createInMemoryTaskRepository([current]);
    const repo = createOfflineTaskRepository({ local, remote, storage: fakeStorage() });

    await expect(repo.sync()).resolves.toEqual([current]);
    expect(await local.list()).toEqual([current]);
  });
});

describe("migrateTasksToRepository", () => {
  it("copia as missões locais para a conta", async () => {
    const tasks = [createTask({ title: "Antiga" }), createTask({ title: "Outra" })];
    const target = createInMemoryTaskRepository();
    await expect(migrateTasksToRepository(createInMemoryTaskRepository(tasks), target)).resolves.toBe(2);
    expect(await target.list()).toEqual(tasks);
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
