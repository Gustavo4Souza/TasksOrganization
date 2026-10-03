"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTask,
  PomodoroTimer,
  type PomodoroSnapshot,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@tasksorg/core";

type View = "overview" | "tasks" | "kanban";
type TaskFilter = "all" | TaskStatus;

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluídas",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const PHASE_LABEL: Record<PomodoroSnapshot["phase"], string> = {
  focus: "Foco",
  shortBreak: "Pausa curta",
  longBreak: "Pausa longa",
};

const initialTasks: Task[] = [
  createTask({
    title: "Definir prioridades da semana",
    description: "Revisar objetivos e organizar as entregas mais importantes.",
    priority: "high",
    dueDate: "2026-10-03",
  }),
  createTask({
    title: "Estudar uma hora de TypeScript",
    priority: "medium",
    dueDate: "2026-10-04",
    scope: "weekly",
  }),
  createTask({
    title: "Organizar documentos pessoais",
    priority: "low",
  }),
  {
    ...createTask({ title: "Planejar próxima sprint", priority: "high" }),
    status: "doing",
  },
  {
    ...createTask({ title: "Configurar ambiente do projeto", priority: "medium" }),
    status: "done",
  },
];

function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
}

function formatDueDate(date?: string): string {
  if (!date) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .replace(".", "");
}

function isOverdue(task: Task): boolean {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate < new Date().toISOString().slice(0, 10));
}

function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: TaskStatus) => void }) {
  return (
    <article className={`task-row ${task.status === "done" ? "is-done" : ""}`}>
      <button
        className={`check-button ${task.status === "done" ? "checked" : ""}`}
        onClick={() => onStatusChange(task.id, task.status === "done" ? "todo" : "done")}
        aria-label={task.status === "done" ? "Reabrir tarefa" : "Concluir tarefa"}
      >
        {task.status === "done" ? "✓" : ""}
      </button>
      <div className="task-row-content">
        <strong>{task.title}</strong>
        {task.description && <span>{task.description}</span>}
        <div className="task-row-meta">
          <span className={`priority priority-${task.priority}`}><i /> {PRIORITY_LABEL[task.priority]}</span>
          <span className={isOverdue(task) ? "overdue" : ""}>◷ {formatDueDate(task.dueDate)}</span>
        </div>
      </div>
      <select
        className="status-select"
        value={task.status}
        onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
        aria-label={`Status de ${task.title}`}
      >
        <option value="todo">A fazer</option>
        <option value="doing">Em andamento</option>
        <option value="done">Concluída</option>
      </select>
    </article>
  );
}

function PomodoroCard({ snapshot, onStart, onPause, onReset }: {
  snapshot: PomodoroSnapshot;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <section className="pomodoro-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Sessão de foco</span>
          <h2>Pomodoro</h2>
        </div>
        <span className={`timer-state ${snapshot.state}`}>{snapshot.state === "running" ? "Em andamento" : "Pronto"}</span>
      </div>
      <div className="timer-display">
        <span className="timer-phase">{PHASE_LABEL[snapshot.phase]}</span>
        <strong>{formatTime(snapshot.remainingSeconds)}</strong>
        <span>{snapshot.completedFocusCycles} ciclos concluídos</span>
      </div>
      <div className="timer-controls">
        {snapshot.state === "running" ? (
          <button className="button button-primary" onClick={onPause}>Pausar</button>
        ) : (
          <button className="button button-primary" onClick={onStart}>Iniciar foco</button>
        )}
        <button className="button button-ghost" onClick={onReset}>Reiniciar</button>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [view, setView] = useState<View>("overview");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const timerRef = useRef(new PomodoroTimer());
  const [snapshot, setSnapshot] = useState<PomodoroSnapshot>(timerRef.current.getSnapshot());

  useEffect(() => {
    const interval = setInterval(() => {
      timerRef.current.tick(1);
      setSnapshot(timerRef.current.getSnapshot());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((task) => task.status === "todo").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  const filteredTasks = useMemo(
    () => filter === "all" ? tasks : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  function updateStatus(id: string, status: TaskStatus) {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, status, updatedAt: new Date().toISOString() }
      : task));
  }

  function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setTasks((current) => [...current, createTask({ title, priority, dueDate: dueDate || undefined })]);
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setIsFormOpen(false);
  }

  const pageTitle = view === "overview" ? "Visão geral" : view === "tasks" ? "Minhas tarefas" : "Kanban";
  const pageSubtitle = view === "overview"
    ? "Organize seu dia e mantenha o foco no que importa."
    : view === "tasks"
      ? "Acompanhe todas as suas tarefas em um só lugar."
      : "Visualize o fluxo de trabalho e mova suas tarefas.";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✓</span><span>Tasks<span>Org</span></span></div>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>⌂</span> Visão geral</button>
          <button className={view === "tasks" ? "active" : ""} onClick={() => setView("tasks")}><span>☷</span> Minhas tarefas <b>{counts.all}</b></button>
          <button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}><span>▦</span> Kanban</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span>✦</span><strong>Foco no essencial</strong><small>Use o Pomodoro para avançar uma tarefa de cada vez.</small></div>
          <div className="profile"><div className="avatar">G</div><div><strong>Gui</strong><small>Meu espaço</small></div><span>•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Meu espaço</span><b>/</b><strong>{pageTitle}</strong></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Pesquisar">⌕</button><button className="icon-button" aria-label="Notificações">♧</button><button className="avatar small">G</button></div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div><h1>{pageTitle}</h1><p>{pageSubtitle}</p></div>
            <button className="button button-primary" onClick={() => setIsFormOpen(true)}>+ Nova tarefa</button>
          </div>

          {isFormOpen && (
            <form className="new-task-form" onSubmit={addTask}>
              <div className="form-main"><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="O que precisa ser feito?" aria-label="Título da tarefa" /><button type="button" className="close-button" onClick={() => setIsFormOpen(false)}>×</button></div>
              <div className="form-options"><label>Prioridade <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label><label>Data limite <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><button className="button button-primary" type="submit">Criar tarefa</button></div>
            </form>
          )}

          {view === "overview" && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><span className="stat-icon purple">☷</span><small>Total de tarefas</small><strong>{counts.all}</strong><em>no seu espaço</em></div>
                <div className="stat-card"><span className="stat-icon amber">◷</span><small>Em andamento</small><strong>{counts.doing}</strong><em>mantenha o ritmo</em></div>
                <div className="stat-card"><span className="stat-icon green">✓</span><small>Concluídas</small><strong>{counts.done}</strong><em>bom trabalho!</em></div>
                <div className="stat-card"><span className="stat-icon red">!</span><small>Atrasadas</small><strong>{counts.overdue}</strong><em>{counts.overdue ? "precisam de atenção" : "tudo em dia"}</em></div>
              </div>
              <div className="overview-grid">
                <section className="panel priority-panel"><div className="section-heading"><div><span className="eyebrow">Para começar</span><h2>Prioridades de hoje</h2></div><button className="text-button" onClick={() => setView("tasks")}>Ver todas →</button></div>{tasks.filter((task) => task.status !== "done").slice(0, 3).map((task) => <TaskRow key={task.id} task={task} onStatusChange={updateStatus} />)}</section>
                <PomodoroCard snapshot={snapshot} onStart={() => { timerRef.current.start(); setSnapshot(timerRef.current.getSnapshot()); }} onPause={() => { timerRef.current.pause(); setSnapshot(timerRef.current.getSnapshot()); }} onReset={() => { timerRef.current.reset(); setSnapshot(timerRef.current.getSnapshot()); }} />
              </div>
            </>
          )}

          {view === "tasks" && (
            <section className="panel tasks-panel">
              <div className="filter-bar"><div className="filter-tabs">{(["all", "todo", "doing", "done"] as TaskFilter[]).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "Todas" : STATUS_LABEL[item as TaskStatus]} <span>{item === "all" ? counts.all : counts[item]}</span></button>)}</div><button className="sort-button">Ordenar por <b>prioridade</b>⌄</button></div>
              <div className="task-list">{filteredTasks.map((task) => <TaskRow key={task.id} task={task} onStatusChange={updateStatus} />)}</div>
              {filteredTasks.length === 0 && <div className="empty-state">Nenhuma tarefa encontrada neste filtro.</div>}
            </section>
          )}

          {view === "kanban" && (
            <div className="kanban-board">{(["todo", "doing", "done"] as TaskStatus[]).map((status) => <section className="kanban-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData("task-id"); if (id) updateStatus(id, status); }}><div className="column-heading"><span className={`column-dot ${status}`} /><h2>{STATUS_LABEL[status]}</h2><span>{tasks.filter((task) => task.status === status).length}</span></div>{tasks.filter((task) => task.status === status).map((task) => <article className="kanban-card" key={task.id} draggable onDragStart={(event) => event.dataTransfer.setData("task-id", task.id)}><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<div><span className={`priority priority-${task.priority}`}><i />{PRIORITY_LABEL[task.priority]}</span><span className={isOverdue(task) ? "overdue" : ""}>◷ {formatDueDate(task.dueDate)}</span></div></article>)}</section>)}</div>
          )}
        </div>
      </main>
    </div>
  );
}
