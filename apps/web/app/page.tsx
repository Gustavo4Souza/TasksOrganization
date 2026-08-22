"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTask,
  PomodoroTimer,
  type PomodoroSnapshot,
  type Task,
  type TaskScope,
} from "@tasksorg/core";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const PHASE_LABEL: Record<PomodoroSnapshot["phase"], string> = {
  focus: "Foco",
  shortBreak: "Pausa curta",
  longBreak: "Pausa longa",
};

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<TaskScope>("daily");

  const timerRef = useRef(new PomodoroTimer());
  const [snapshot, setSnapshot] = useState<PomodoroSnapshot>(timerRef.current.getSnapshot());

  useEffect(() => {
    const interval = setInterval(() => {
      timerRef.current.tick(1);
      setSnapshot(timerRef.current.getSnapshot());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => {
    const scopes: TaskScope[] = ["daily", "weekly", "yearly"];
    return scopes.map((s) => ({ scope: s, items: tasks.filter((t) => t.scope === s) }));
  }, [tasks]);

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const task = createTask({ title, scope });
    setTasks((prev) => [...prev, task]);
    setTitle("");
  }

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t)),
    );
  }

  const scopeLabel: Record<TaskScope, string> = { daily: "Diária", weekly: "Semanal", yearly: "Anual" };

  return (
    <main>
      <h1>TasksOrg</h1>
      <p className="subtitle">POC — organização de tarefas + timer Pomodoro (inspirado no Notion)</p>

      <section>
        <h2>Tarefas</h2>
        <form className="task-form" onSubmit={handleAddTask}>
          <input
            type="text"
            placeholder="Nova tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={scope} onChange={(e) => setScope(e.target.value as TaskScope)}>
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="yearly">Anual</option>
          </select>
          <button type="submit">Adicionar</button>
        </form>

        {grouped.map(({ scope: s, items }) => (
          <div key={s}>
            <h3>{scopeLabel[s]}</h3>
            {items.length === 0 ? (
              <p className="task-meta">Nenhuma tarefa ainda.</p>
            ) : (
              <ul className="task-list">
                {items.map((task) => (
                  <li key={task.id} className={`task-item ${task.status === "done" ? "done" : ""}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.status === "done"}
                        onChange={() => toggleDone(task.id)}
                      />
                      <span className="task-title"> {task.title}</span>
                    </label>
                    <span className="task-meta">{task.priority}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section className="pomodoro">
        <h2>Pomodoro</h2>
        <p className="phase">{PHASE_LABEL[snapshot.phase]}</p>
        <p className="time">{formatTime(snapshot.remainingSeconds)}</p>
        <p className="task-meta">Ciclos de foco concluídos: {snapshot.completedFocusCycles}</p>
        <div className="controls">
          <button
            onClick={() => {
              timerRef.current.start();
              setSnapshot(timerRef.current.getSnapshot());
            }}
          >
            Iniciar
          </button>
          <button
            className="secondary"
            onClick={() => {
              timerRef.current.pause();
              setSnapshot(timerRef.current.getSnapshot());
            }}
          >
            Pausar
          </button>
          <button
            className="secondary"
            onClick={() => {
              timerRef.current.reset();
              setSnapshot(timerRef.current.getSnapshot());
            }}
          >
            Resetar
          </button>
        </div>
      </section>
    </main>
  );
}
