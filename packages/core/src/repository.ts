import type { Task, TaskPriority, TaskScope, TaskStatus } from "./task.js";

/**
 * Onde as tarefas ficam guardadas. As telas falam só com esta interface; trocar
 * localStorage por arquivo (desktop) ou por API (MVP 2) não muda nada nelas.
 * Assíncrona porque arquivo e rede são.
 */
export interface TaskRepository {
  list(): Promise<Task[]>;
  /** Cria ou substitui a tarefa com o mesmo id. */
  save(task: Task): Promise<void>;
  remove(id: string): Promise<void>;
}

/** O pedaço da API `Storage` do navegador que o adaptador usa (window.localStorage cabe aqui). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** O pedaço de `node:fs/promises` que o adaptador usa (o próprio módulo cabe aqui). */
export interface TextFileSystem {
  readFile(path: string, encoding: "utf8"): Promise<string>;
  writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
}

export class TaskRepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "TaskRepositoryError";
    if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
  }
}

/** Formato salvo. `version` permite migrar o arquivo quando o modelo mudar. */
interface StoredTasks {
  version: 1;
  tasks: Task[];
}

const SCOPES: TaskScope[] = ["daily", "weekly", "yearly"];
const STATUSES: TaskStatus[] = ["todo", "doing", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Valida uma tarefa vinda de fora (arquivo editado à mão, versão antiga) e
 * preenche campos que versões anteriores não tinham.
 */
export function normalizeTask(raw: unknown): Task {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.title !== "string") {
    throw new TaskRepositoryError("Tarefa salva sem id ou título.");
  }
  const scope = SCOPES.includes(raw.scope as TaskScope) ? (raw.scope as TaskScope) : "daily";
  const status = STATUSES.includes(raw.status as TaskStatus) ? (raw.status as TaskStatus) : "todo";
  const priority = PRIORITIES.includes(raw.priority as TaskPriority) ? (raw.priority as TaskPriority) : "medium";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString();
  return {
    id: raw.id,
    title: raw.title,
    description: typeof raw.description === "string" ? raw.description : undefined,
    scope,
    status,
    priority,
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : undefined,
    pomodoros: typeof raw.pomodoros === "number" && raw.pomodoros >= 0 ? Math.floor(raw.pomodoros) : 0,
    completedAt: status === "done" && typeof raw.completedAt === "string" ? raw.completedAt : undefined,
    createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt,
  };
}

export function parseStoredTasks(text: string): Task[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new TaskRepositoryError("Os dados salvos não são um JSON válido.", { cause: error });
  }
  // Aceita também uma lista solta, sem o envelope { version, tasks }.
  const list = Array.isArray(data) ? data : isRecord(data) ? data.tasks : undefined;
  if (!Array.isArray(list)) {
    throw new TaskRepositoryError("Os dados salvos não têm uma lista de tarefas.");
  }
  return list.map(normalizeTask);
}

export function serializeTasks(tasks: Task[]): string {
  const stored: StoredTasks = { version: 1, tasks };
  return JSON.stringify(stored, null, 2);
}

/**
 * Repositório que guarda todas as tarefas num único texto (chave do localStorage,
 * arquivo JSON). Lê uma vez e mantém em memória; cada escrita grava tudo de novo.
 */
function snapshotRepository(io: { read(): Promise<string | null>; write(text: string): Promise<void> }): TaskRepository {
  let cache: Map<string, Task> | undefined;
  // Escritas em fila, para duas alterações seguidas não gravarem fora de ordem.
  let pending: Promise<void> = Promise.resolve();

  async function load(): Promise<Map<string, Task>> {
    if (!cache) {
      const text = await io.read();
      cache = new Map((text ? parseStoredTasks(text) : []).map((t) => [t.id, t]));
    }
    return cache;
  }

  async function persist(tasks: Map<string, Task>): Promise<void> {
    const text = serializeTasks(Array.from(tasks.values()));
    pending = pending.catch(() => undefined).then(() => io.write(text));
    try {
      await pending;
    } catch (error) {
      cache = undefined; // a memória ficou à frente do armazenamento: a próxima leitura recarrega
      throw error;
    }
  }

  return {
    async list() {
      return Array.from((await load()).values());
    },
    async save(task) {
      const tasks = await load();
      tasks.set(task.id, task);
      await persist(tasks);
    },
    async remove(id) {
      const tasks = await load();
      if (tasks.delete(id)) await persist(tasks);
    },
  };
}

/** Web: guarda as tarefas no localStorage do navegador. */
export function createLocalStorageTaskRepository(storage: KeyValueStorage, key = "tasksorg:tasks"): TaskRepository {
  return snapshotRepository({
    read: async () => storage.getItem(key),
    write: async (text) => storage.setItem(key, text),
  });
}

/** Desktop: guarda as tarefas num arquivo JSON (ex.: na pasta userData do Electron). */
export function createJsonFileTaskRepository(fs: TextFileSystem, filePath: string): TaskRepository {
  return snapshotRepository({
    async read() {
      try {
        return await fs.readFile(filePath, "utf8");
      } catch (error) {
        if (isRecord(error) && error.code === "ENOENT") return null; // primeira execução
        throw error;
      }
    },
    write: (text) => fs.writeFile(filePath, text, "utf8"),
  });
}

/** Testes e protótipos: repositório só em memória. */
export function createInMemoryTaskRepository(initial: Task[] = []): TaskRepository {
  let text: string | null = initial.length ? serializeTasks(initial) : null;
  return snapshotRepository({
    read: async () => text,
    write: async (next) => {
      text = next;
    },
  });
}

export interface HttpResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export interface HttpFetchLike {
  (url: string, init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    credentials?: "include";
  }): Promise<HttpResponseLike>;
}

export interface HttpTaskRepositoryOptions {
  baseUrl: string;
  fetch: HttpFetchLike;
  /** Token opcional para clientes sem cookie, como o app mobile. */
  getToken?: () => string | undefined;
}

/** Adaptador do MVP 2: mantém as telas dependentes apenas de TaskRepository. */
export function createHttpTaskRepository(options: HttpTaskRepositoryOptions): TaskRepository {
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  if (!baseUrl) throw new TaskRepositoryError("A URL da API é obrigatória.");

  function headers(withBody = false): Record<string, string> {
    const result: Record<string, string> = { accept: "application/json" };
    if (withBody) result["content-type"] = "application/json";
    const token = options.getToken?.();
    if (token) result.authorization = `Bearer ${token}`;
    return result;
  }

  async function request(path: string, init?: Parameters<HttpFetchLike>[1]): Promise<HttpResponseLike> {
    let response: HttpResponseLike;
    try {
      response = await options.fetch(`${baseUrl}${path}`, { credentials: "include", ...init });
    } catch (error) {
      throw new TaskRepositoryError("Não foi possível acessar a API.", { cause: error });
    }
    if (!response.ok) throw new TaskRepositoryError(`A API recusou a operação (${response.status}).`);
    return response;
  }

  return {
    async list() {
      const payload = await (await request("/tasks", { headers: headers() })).json();
      const tasks = isRecord(payload) ? payload.tasks : undefined;
      if (!Array.isArray(tasks)) throw new TaskRepositoryError("A API retornou uma lista de tarefas inválida.");
      return tasks.map(normalizeTask);
    },
    async save(task) {
      await request(`/tasks/${encodeURIComponent(task.id)}`, { method: "PUT", headers: headers(true), body: JSON.stringify(task) });
    },
    async remove(id) {
      await request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() });
    },
  };
}

type PendingTaskOperation =
  | { type: "save"; task: Task }
  | { type: "remove"; id: string };

export interface OfflineTaskRepository extends TaskRepository {
  /** Tenta enviar a fila e atualizar o cache local com a versão da API. */
  sync(): Promise<Task[]>;
  pendingCount(): number;
}

export interface OfflineTaskRepositoryOptions {
  local: TaskRepository;
  remote: TaskRepository;
  storage: KeyValueStorage;
  queueKey?: string;
}

function readQueue(storage: KeyValueStorage, key: string): PendingTaskOperation[] {
  const text = storage.getItem(key);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): PendingTaskOperation[] => {
      if (!isRecord(item)) return [];
      if (item.type === "remove" && typeof item.id === "string") return [{ type: "remove", id: item.id }];
      if (item.type === "save") {
        try { return [{ type: "save", task: normalizeTask(item.task) }]; } catch { return []; }
      }
      return [];
    });
  } catch {
    return [];
  }
}

function writeQueue(storage: KeyValueStorage, key: string, queue: PendingTaskOperation[]): void {
  storage.setItem(key, JSON.stringify(queue));
}

/**
 * Cache local-first com fila persistente. A interface continua sendo
 * TaskRepository; quando a API volta, `sync` reaplica as operações na ordem e
 * substitui o cache pelo estado autorizado do servidor.
 */
export function createOfflineTaskRepository(options: OfflineTaskRepositoryOptions): OfflineTaskRepository {
  const queueKey = options.queueKey ?? "tasksorg:sync-queue";
  let queue = readQueue(options.storage, queueKey);

  function enqueue(operation: PendingTaskOperation): void {
    const id = operation.type === "save" ? operation.task.id : operation.id;
    queue = [...queue.filter((item) => (item.type === "save" ? item.task.id : item.id) !== id), operation];
    writeQueue(options.storage, queueKey, queue);
  }

  async function flush(): Promise<void> {
    while (queue.length) {
      const operation = queue[0]!;
      if (operation.type === "save") await options.remote.save(operation.task);
      else await options.remote.remove(operation.id);
      queue = queue.slice(1);
      writeQueue(options.storage, queueKey, queue);
    }
  }

  async function replaceLocal(tasks: Task[]): Promise<void> {
    const nextIds = new Set(tasks.map((task) => task.id));
    for (const existing of await options.local.list()) {
      if (!nextIds.has(existing.id)) await options.local.remove(existing.id);
    }
    for (const task of tasks) await options.local.save(task);
  }

  async function sync(): Promise<Task[]> {
    await flush();
    const tasks = await options.remote.list();
    await replaceLocal(tasks);
    return tasks;
  }

  return {
    async list() {
      try { return await sync(); } catch { return options.local.list(); }
    },
    async save(task) {
      await options.local.save(task);
      try {
        await options.remote.save(task);
        queue = queue.filter((item) => (item.type === "save" ? item.task.id : item.id) !== task.id);
        writeQueue(options.storage, queueKey, queue);
      } catch {
        enqueue({ type: "save", task });
      }
    },
    async remove(id) {
      await options.local.remove(id);
      try {
        await options.remote.remove(id);
        queue = queue.filter((item) => (item.type === "save" ? item.task.id : item.id) !== id);
        writeQueue(options.storage, queueKey, queue);
      } catch {
        enqueue({ type: "remove", id });
      }
    },
    sync,
    pendingCount: () => queue.length,
  };
}

/** Copia tarefas locais para a conta sem apagar a origem, que vira cache offline. */
export async function migrateTasksToRepository(source: TaskRepository, target: TaskRepository): Promise<number> {
  const tasks = await source.list();
  for (const task of tasks) await target.save(task);
  return tasks.length;
}
