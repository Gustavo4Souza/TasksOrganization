import type { Task, TaskScope, TaskStatus } from "@tasksorg/core";

export function resumoDoEscopo(tarefas: Task[], escopo: TaskScope): Record<TaskStatus, number> {
  const resumo: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const tarefa of tarefas) if (tarefa.scope === escopo) resumo[tarefa.status] += 1;
  return resumo;
}

export function tarefasDaColuna(tarefas: Task[], status: TaskStatus): Task[] {
  return tarefas.filter((tarefa) => tarefa.status === status);
}
