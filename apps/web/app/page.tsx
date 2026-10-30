"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createLocalStorageTaskRepository, TaskStore, weekProgress, yearProgress, type Task, type TaskPriority, type TaskScope } from "@tasksorg/core";
import { Button, Panel, ScopeTabs, StatBar, TaskCard, usePomodoro, usePomodoroSettings } from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";
import "./quadro.css";

const scopes: TaskScope[] = ["daily", "weekly", "yearly"];
const phases = { focus: "Foco", shortBreak: "Pausa curta", longBreak: "Pausa longa" };
const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<TaskScope>("daily");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [theme, setTheme] = useState<"castelo" | "pergaminho">("castelo");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftPriority, setDraftPriority] = useState<TaskPriority>("medium");
  const [draftScope, setDraftScope] = useState<TaskScope>("daily");
  const [draftDueDate, setDraftDueDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const storeRef = useRef(new TaskStore());
  const repoRef = useRef<ReturnType<typeof createLocalStorageTaskRepository> | null>(null);
  const loadedRef = useRef(false);
  const pendingCreditsRef = useRef(0);
  const { config } = usePomodoroSettings();
  const attach = useCallback((timer: import("@tasksorg/core").PomodoroTimer) => timer.onPhaseChange((change) => {
    if (change.from !== "focus" || change.reason !== "completed") return;
    if (!loadedRef.current) { pendingCreditsRef.current += 1; return; }
    const battle = storeRef.current.getBattle();
    if (!battle) return;
    const updated = storeRef.current.addPomodoro(battle.id);
    setTasks(storeRef.current.list());
    void repoRef.current?.save(updated).catch(() => setError("Não foi possível salvar o foco."));
  }), []);
  const pomo = usePomodoro({ config, attach });

  useEffect(() => {
    let active = true;
    try {
      const repo = createLocalStorageTaskRepository(window.localStorage);
      repoRef.current = repo;
      void repo.list().then((items) => { if (active) {
        storeRef.current = new TaskStore(items);
        loadedRef.current = true;
        const battle = storeRef.current.getBattle();
        if (battle && pendingCreditsRef.current) {
          let updated = battle;
          for (let i = 0; i < pendingCreditsRef.current; i++) updated = storeRef.current.addPomodoro(battle.id);
          void repo.save(updated).catch(() => setError("Não foi possível salvar o foco."));
        }
        pendingCreditsRef.current = 0;
        setTasks(storeRef.current.list()); setReady(true);
      } }).catch(() => { if (active) { loadedRef.current = true; pendingCreditsRef.current = 0; setError("Não foi possível carregar as missões."); setReady(true); } });
      const saved = window.localStorage.getItem("tasksorg:theme");
      setTheme(saved === "castelo" || saved === "pergaminho" ? saved : window.matchMedia("(prefers-color-scheme: light)").matches ? "pergaminho" : "castelo");
    } catch { setError("Armazenamento local indisponível."); setReady(true); }
    return () => { active = false; };
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { window.localStorage.setItem("tasksorg:theme", theme); } catch { /* preferência só nesta sessão */ } }, [theme]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button, a"))) return;
      if (event.code === "Space") { event.preventDefault(); pomo.toggle(); }
      if (event.key.toLowerCase() === "n") { event.preventDefault(); inputRef.current?.focus(); }
      if (["1", "2", "3"].includes(event.key)) setScope(scopes[Number(event.key) - 1]);
      if (event.key.toLowerCase() === "f") window.location.assign("/foco");
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [pomo]);

  async function mutate(action: (store: TaskStore) => { save?: Task[]; remove?: string }) {
    try {
      const result = action(storeRef.current);
      setTasks(storeRef.current.list());
      if (result.remove) await repoRef.current?.remove(result.remove);
      for (const task of result.save ?? []) await repoRef.current?.save(task);
      setError("");
    } catch { setError("Não foi possível salvar. Recarregue a página antes de continuar."); }
  }
  const visible = tasks.filter((task) => task.scope === scope);
  const counts = Object.fromEntries(scopes.map((key) => [key, tasks.filter((task) => task.scope === key).length])) as Record<TaskScope, number>;
  const battle = tasks.find((task) => task.status === "doing");
  const week = weekProgress(tasks, new Date());
  const months = yearProgress(tasks, new Date().getFullYear(), new Date());

  return <main className="board">
    <header className="board-header"><div><p className="board-eyebrow">TasksOrg / Quadro de missões</p><h1>Seu próximo passo</h1></div><div className="board-header-actions"><Link href="/foco">Modo foco</Link><Button variant="secondary" onClick={() => setTheme(theme === "castelo" ? "pergaminho" : "castelo")}>Tema {theme === "castelo" ? "Pergaminho" : "Castelo"}</Button></div></header>
    <div className="board-hud"><ScopeTabs id="board-scope" value={scope} onChange={setScope} counts={counts} /><StatBar label="XP do dia" value={week.find((day) => day.isToday)?.completed ?? 0} max={5} /><form className="board-create" onSubmit={(event) => { event.preventDefault(); if (!title.trim() || !ready) return; void mutate((store) => ({ save: [store.add({ title, scope, priority })] })); setTitle(""); }}><label className="sr-only" htmlFor="new-task">Nova missão</label><input id="new-task" ref={inputRef} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nova missão..." required /><label className="sr-only" htmlFor="new-priority">Prioridade</label><select id="new-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select><Button type="submit" disabled={!ready}>Criar</Button></form></div>
    {error && <p className="board-error" role="alert">{error}</p>}
    <div id={`board-scope-panel-${scope}`} role="tabpanel" aria-labelledby={`board-scope-tab-${scope}`} className="board-grid">
      {(["todo", "doing", "done"] as const).map((status) => {
        const items = visible.filter((task) => task.status === status);
        const shown = items.slice(0, 11);
        const hidden = items.slice(11);
        const move = (id: string) => {
          if (storeRef.current.get(id)?.status === status) return;
          void mutate((store) => {
            if (status === "doing") {
              const { started, paused } = store.startBattle(id);
              return { save: paused ? [paused, started] : [started] };
            }
            return { save: [store.updateStatus(id, status)] };
          });
        };
        return <Panel
          key={status}
          title={{ todo: "Missões", doing: "Em batalha", done: "Conquistas" }[status]}
          className="board-column"
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
          onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (storeRef.current.get(id)) move(id); }}
        >
          <p className="board-count">{items.length} missões</p>
          {items.length === 0 && <p className="board-empty">{status === "todo" ? "Crie sua primeira missão." : status === "doing" ? "Escolha uma missão para batalhar." : "Suas conquistas aparecerão aqui."}</p>}
          <div className="board-cards">{shown.map((task) => <div
            id={`board-task-${task.id}`}
            key={task.id}
            className="board-card"
            draggable={editing !== task.id}
            onDragStart={(event) => { event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.effectAllowed = "move"; }}
          >
            {editing === task.id
              ? <form className="board-edit" onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) return; void mutate((store) => ({ save: [store.update(task.id, { title: draft, priority: draftPriority, scope: draftScope, dueDate: draftDueDate || undefined })] })); setEditing(null); }}>
                  <input aria-label="Editar missão" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <select aria-label="Prioridade da missão" value={draftPriority} onChange={(event) => setDraftPriority(event.target.value as TaskPriority)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select>
                  <select aria-label="Escopo da missão" value={draftScope} onChange={(event) => setDraftScope(event.target.value as TaskScope)}><option value="daily">Hoje</option><option value="weekly">Semana</option><option value="yearly">Ano</option></select>
                  <input type="date" aria-label="Prazo da missão" value={draftDueDate} onChange={(event) => setDraftDueDate(event.target.value)} />
                  <Button type="submit">Salvar</Button><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
                </form>
              : <TaskCard title={task.title} status={task.status} priority={task.priority} pomodoros={task.pomodoros} compact={items.length > 6} actions={<>
                  {status !== "done" && <Button onClick={() => void mutate((store) => ({ save: [store.complete(task.id)] }))}>Concluir</Button>}
                  {status === "todo" && <Button variant="secondary" onClick={() => void mutate((store) => { const { started, paused } = store.startBattle(task.id); return { save: paused ? [paused, started] : [started] }; })}>Batalhar</Button>}
                  {status === "doing" && <Button variant="secondary" onClick={() => void mutate((store) => ({ save: [store.updateStatus(task.id, "todo")] }))}>Recuar</Button>}
                  {status === "done" && <Button variant="secondary" onClick={() => void mutate((store) => ({ save: [store.updateStatus(task.id, "todo")] }))}>Reabrir</Button>}
                  <Button variant="secondary" onClick={() => { setEditing(task.id); setDraft(task.title); setDraftPriority(task.priority); setDraftScope(task.scope); setDraftDueDate(task.dueDate ?? ""); }}>Editar</Button>
                  <Button variant="danger" onClick={() => { if (window.confirm(`Excluir “${task.title}”?`)) void mutate((store) => { store.remove(task.id); return { remove: task.id }; }); }}>Excluir</Button>
                </>} />}
          </div>)}</div>
          {hidden.length > 0 && <details className="board-overflow"><summary>+{hidden.length} missões</summary><div className="board-overflow-list">{hidden.map((task) => <button key={task.id} type="button" onClick={() => { setExpanded(status); requestAnimationFrame(() => document.getElementById(`board-task-${task.id}`)?.scrollIntoView?.({ block: "nearest" })); }}>{task.title}</button>)}</div></details>}
          {expanded === status && hidden.length > 0 && <div className="board-cards board-more">{hidden.map((task) => <div key={task.id} id={`board-task-${task.id}`} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}>
            {editing === task.id
              ? <form className="board-edit" onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) return; void mutate((store) => ({ save: [store.update(task.id, { title: draft, priority: draftPriority, scope: draftScope, dueDate: draftDueDate || undefined })] })); setEditing(null); }}><input aria-label="Editar missão" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} /><select aria-label="Prioridade da missão" value={draftPriority} onChange={(event) => setDraftPriority(event.target.value as TaskPriority)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select><select aria-label="Escopo da missão" value={draftScope} onChange={(event) => setDraftScope(event.target.value as TaskScope)}><option value="daily">Hoje</option><option value="weekly">Semana</option><option value="yearly">Ano</option></select><input type="date" aria-label="Prazo da missão" value={draftDueDate} onChange={(event) => setDraftDueDate(event.target.value)} /><Button type="submit">Salvar</Button><Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button></form>
              : <TaskCard title={task.title} status={task.status} priority={task.priority} pomodoros={task.pomodoros} compact actions={<>
                {status !== "done" && <Button onClick={() => void mutate((store) => ({ save: [store.complete(task.id)] }))}>Concluir</Button>}
                {status === "todo" && <Button variant="secondary" onClick={() => void mutate((store) => { const { started, paused } = store.startBattle(task.id); return { save: paused ? [paused, started] : [started] }; })}>Batalhar</Button>}
                {status === "doing" && <Button variant="secondary" onClick={() => void mutate((store) => ({ save: [store.updateStatus(task.id, "todo")] }))}>Recuar</Button>}
                {status === "done" && <Button variant="secondary" onClick={() => void mutate((store) => ({ save: [store.updateStatus(task.id, "todo")] }))}>Reabrir</Button>}
                <Button variant="secondary" onClick={() => { setEditing(task.id); setDraft(task.title); setDraftPriority(task.priority); setDraftScope(task.scope); setDraftDueDate(task.dueDate ?? ""); }}>Editar</Button>
                <Button variant="danger" onClick={() => { if (window.confirm(`Excluir “${task.title}”?`)) void mutate((store) => { store.remove(task.id); return { remove: task.id }; }); }}>Excluir</Button>
              </>} />}
          </div>)}</div>}
        </Panel>;
      })}
      <aside className="board-side"><Panel title="Pomodoro"><p className="board-phase">{phases[pomo.snapshot.phase]} · {battle?.title ?? "Sem missão em batalha"}</p><p className="board-timer">{time(pomo.snapshot.remainingSeconds)}</p><div className="board-actions"><Button onClick={pomo.toggle}>{pomo.snapshot.state === "running" ? "Pausar" : "Iniciar"}</Button><Button variant="secondary" onClick={pomo.reset}>Reiniciar</Button><Button variant="secondary" onClick={pomo.skip}>Pular</Button></div></Panel><Panel title="Mapa"><div className="board-map" aria-label={scope === "yearly" ? "Progresso do ano" : "Progresso da semana"}>{scope === "yearly" ? months.map((month) => <span key={month.month} className={`board-map-cell level-${month.level}`} title={`${month.month}: ${month.completed} conquistas`}>{month.month.slice(5)}</span>) : week.map((day) => <span key={day.date} className={`board-map-cell level-${day.level}`} title={`${day.date}: ${day.completed} conquistas`}>{day.date.slice(8)}</span>)}</div></Panel></aside>
    </div>
  </main>;
}
