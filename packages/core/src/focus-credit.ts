import type { PomodoroTimer } from "./pomodoro.js";
import type { Task, TaskStore } from "./task.js";

/**
 * Liga o Pomodoro às tarefas: cada ciclo de Foco que termina credita +1 pomodoro
 * na missão em batalha (TaskStore.getBattle). Pausas não creditam nada; sem
 * missão em batalha o foco não é atribuído a ninguém.
 *
 * `onCredit` recebe a tarefa já atualizada, para a interface salvar no
 * TaskRepository e mostrar o aviso. Devolve a função que desfaz a ligação.
 */
export function creditFocusToBattle(
  timer: PomodoroTimer,
  store: TaskStore,
  onCredit?: (task: Task) => void,
): () => void {
  return timer.onPhaseChange((change) => {
    if (change.from !== "focus") return;
    const battle = store.getBattle();
    if (!battle) return;
    const credited = store.addPomodoro(battle.id);
    onCredit?.(credited);
  });
}
