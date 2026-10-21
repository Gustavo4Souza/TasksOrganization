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

type Theme = "castle" | "parchment";
const THEME_STORAGE_KEY = "tasksorg:theme";

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<TaskScope>("daily");
  const [theme, setTheme] = useState<Theme>("castle");
  const [themeIsReady, setThemeIsReady] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const timerRef = useRef(new PomodoroTimer());
  const [snapshot, setSnapshot] = useState<PomodoroSnapshot>(timerRef.current.getSnapshot());

  useEffect(() => {
    const interval = setInterval(() => {
      timerRef.current.tick(1);
      setSnapshot(timerRef.current.getSnapshot());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "castle" || savedTheme === "parchment") {
      setTheme(savedTheme);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: light)").matches ? "parchment" : "castle");
    }
    setThemeIsReady(true);
  }, []);

  useEffect(() => {
    if (themeIsReady) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, themeIsReady]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, select, textarea, button, a, [role=button]"))) return;

      if (event.code === "Space") {
        event.preventDefault();
        if (timerRef.current.getSnapshot().state === "running") timerRef.current.pause();
        else timerRef.current.start();
        setSnapshot(timerRef.current.getSnapshot());
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        titleInputRef.current?.focus();
      } else if (event.key === "1" || event.key === "2" || event.key === "3") {
        event.preventDefault();
        if (event.key === "1") setScope("daily");
        if (event.key === "2") setScope("weekly");
        if (event.key === "3") setScope("yearly");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
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
    <main data-theme={theme}>
      <header className="app-header">
        <h1>TasksOrg</h1>
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Ativar tema ${theme === "castle" ? "Pergaminho" : "Castelo"}`}
          onClick={() => setTheme((current) => (current === "castle" ? "parchment" : "castle"))}
        >
          {theme === "castle" ? "Pergaminho" : "Castelo"}
        </button>
      </header>
      <p className="subtitle">POC — organização de tarefas + timer Pomodoro (inspirado no Notion)</p>

      <section>
        <h2>Tarefas</h2>
        <form className="task-form" onSubmit={handleAddTask}>
          <label className="sr-only" htmlFor="task-title">Título da nova tarefa</label>
          <input
            id="task-title"
            ref={titleInputRef}
            type="text"
            placeholder="Nova tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="sr-only" htmlFor="task-scope">Escopo da nova tarefa</label>
          <select id="task-scope" value={scope} onChange={(e) => setScope(e.target.value as TaskScope)}>
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
