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
  /** Quantos ciclos de foco do Pomodoro já foram gastos nesta tarefa. */
  pomodoros: number;
  /** Quando a tarefa foi concluída (ISO). Só existe enquanto o status for "done". */
  completedAt?: string;
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

/** Campos que podem ser editados depois de criada. Status tem regras próprias (updateStatus/startBattle). */
export type UpdateTaskInput = Partial<Pick<Task, "title" | "description" | "scope" | "priority" | "dueDate">>;

export type TaskSort = "createdAt" | "priority";

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function validTitle(title: string | undefined): string {
  if (!title || !title.trim()) {
    throw new Error("O título da tarefa não pode ser vazio.");
  }
  return title.trim();
}

export function createTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: validTitle(input.title),
    description: input.description,
    scope: input.scope ?? "daily",
    status: "todo",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
    pomodoros: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** Prioridade alta primeiro; empate fica na ordem de criação. */
export function compareByPriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.localeCompare(b.createdAt);
}

/**
 * Store em memória. A persistência fica num TaskRepository (ver repository.ts):
 * quem consome carrega as tarefas do repositório, passa no construtor e salva
 * depois de cada alteração.
 */
export class TaskStore {
  private tasks: Map<string, Task> = new Map();

  constructor(initial: Task[] = []) {
    for (const task of initial) this.tasks.set(task.id, task);
  }

  add(input: CreateTaskInput): Task {
    const task = createTask(input);
    this.tasks.set(task.id, task);
    return task;
  }

  list(filter?: { scope?: TaskScope; status?: TaskStatus; sort?: TaskSort }): Task[] {
    let items = Array.from(this.tasks.values());
    if (filter?.scope) items = items.filter((t) => t.scope === filter.scope);
    if (filter?.status) items = items.filter((t) => t.status === filter.status);
    return filter?.sort === "priority"
      ? items.sort(compareByPriority)
      : items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /** A tarefa "em batalha" — a que o Pomodoro está contando. Existe no máximo uma. */
  getBattle(): Task | undefined {
    return Array.from(this.tasks.values()).find((t) => t.status === "doing");
  }

  update(id: string, input: UpdateTaskInput): Task {
    const task = this.require(id);
    const changes: UpdateTaskInput = { ...input };
    if (input.title !== undefined) changes.title = validTitle(input.title);
    return this.save({ ...task, ...changes });
  }

  /**
   * Muda o status. Ir para "doing" segue a regra de startBattle (só uma em batalha);
   * concluir registra completedAt, e reabrir apaga.
   */
  updateStatus(id: string, status: TaskStatus): Task {
    if (status === "doing") return this.startBattle(id).started;
    const task = this.require(id);
    const completedAt = status === "done" ? (task.completedAt ?? new Date().toISOString()) : undefined;
    return this.save({ ...task, status, completedAt });
  }

  /**
   * Coloca a tarefa em batalha. Se outra já estava em batalha, ela volta para "todo"
   * e é devolvida em `paused`, para a interface avisar o usuário.
   */
  startBattle(id: string): { started: Task; paused?: Task } {
    const task = this.require(id);
    const current = this.getBattle();
    let paused: Task | undefined;
    if (current && current.id !== id) {
      paused = this.save({ ...current, status: "todo" });
    }
    const started = this.save({ ...task, status: "doing", completedAt: undefined });
    return { started, paused };
  }

  complete(id: string): Task {
    return this.updateStatus(id, "done");
  }

  /** Credita um ciclo de foco concluído na tarefa. */
  addPomodoro(id: string): Task {
    const task = this.require(id);
    return this.save({ ...task, pomodoros: task.pomodoros + 1 });
  }

  remove(id: string): boolean {
    return this.tasks.delete(id);
  }

  private require(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Tarefa ${id} não encontrada.`);
    return task;
  }

  private save(task: Task): Task {
    const updated: Task = { ...task, updatedAt: new Date().toISOString() };
    this.tasks.set(task.id, updated);
    return updated;
  }
}
