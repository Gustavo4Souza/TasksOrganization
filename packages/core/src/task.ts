export type TaskScope = "daily" | "weekly" | "yearly";
export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  scope: TaskScope;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  scope?: TaskScope;
  priority?: TaskPriority;
  dueDate?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createTask(input: CreateTaskInput): Task {
  if (!input.title || !input.title.trim()) {
    throw new Error("O título da tarefa não pode ser vazio.");
  }
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: input.title.trim(),
    description: input.description,
    scope: input.scope ?? "daily",
    status: "todo",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * In-memory store para a POC. Numa próxima etapa isso vira uma camada de
 * persistência real (API + banco), mas a interface pública deve continuar
 * a mesma para não quebrar quem consome o pacote.
 */
export class TaskStore {
  private tasks: Map<string, Task> = new Map();

  add(input: CreateTaskInput): Task {
    const task = createTask(input);
    this.tasks.set(task.id, task);
    return task;
  }

  list(filter?: { scope?: TaskScope; status?: TaskStatus }): Task[] {
    let items = Array.from(this.tasks.values());
    if (filter?.scope) items = items.filter((t) => t.scope === filter.scope);
    if (filter?.status) items = items.filter((t) => t.status === filter.status);
    return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  updateStatus(id: string, status: TaskStatus): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Tarefa ${id} não encontrada.`);
    const updated: Task = { ...task, status, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  complete(id: string): Task {
    return this.updateStatus(id, "done");
  }

  remove(id: string): boolean {
    return this.tasks.delete(id);
  }
}
