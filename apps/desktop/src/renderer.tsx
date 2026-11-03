import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createLocalStorageTaskRepository,
  creditFocusToBattle,
  TaskStore,
  type Task,
  type TaskPriority,
  type TaskScope,
  type PomodoroTimer,
} from "@tasksorg/core";
import {
  Button,
  Panel,
  PomodoroHUD,
  ScopeTabs,
  StatBar,
  TaskCard,
  usePomodoro,
  usePomodoroSettings,
} from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";

declare global {
  interface Window {
    desktop?: {
      getWindowState(): Promise<{ alwaysOnTop: boolean }>;
      setAlwaysOnTop(value: boolean): Promise<boolean>;
    };
  }
}

const scopes: TaskScope[] = ["daily", "weekly", "yearly"];
const labels: Record<TaskScope, string> = { daily: "Hoje", weekly: "Semana", yearly: "Ano" };

function DesktopApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scope, setScope] = useState<TaskScope>("daily");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [theme, setTheme] = useState<"castelo" | "pergaminho">("castelo");
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [error, setError] = useState("");
  const storeRef = useRef(new TaskStore());
  const repoRef = useRef(createLocalStorageTaskRepository(window.localStorage, "tasksorg:desktop:tasks"));
  const { config } = usePomodoroSettings();

  const refresh = useCallback(() => setTasks(storeRef.current.list()), []);
  const save = useCallback(async (changed: Task[]) => {
    try {
      await Promise.all(changed.map((task) => repoRef.current.save(task)));
      setError("");
    } catch {
      setError("Não foi possível salvar as missões.");
    }
  }, []);
  const attach = useCallback((timer: PomodoroTimer) => {
    return creditFocusToBattle(timer, storeRef.current, (task) => void save([task]));
  }, [save]);
  const pomo = usePomodoro({ config, attach });

  useEffect(() => {
    void repoRef.current.list().then((items) => {
      storeRef.current = new TaskStore(items);
      refresh();
    }).catch(() => setError("Não foi possível carregar as missões."));
    const savedTheme = window.localStorage.getItem("tasksorg:desktop:theme");
    if (savedTheme === "castelo" || savedTheme === "pergaminho") setTheme(savedTheme);
    void window.desktop?.getWindowState().then((state) => setAlwaysOnTop(state.alwaysOnTop));
  }, [refresh]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("tasksorg:desktop:theme", theme);
  }, [theme]);

  const visible = useMemo(() => storeRef.current.list({ scope, sort: "priority" }), [tasks, scope]);
  const counts = useMemo(() => Object.fromEntries(scopes.map((item) => [item, tasks.filter((task) => task.scope === item).length])) as Record<TaskScope, number>, [tasks]);
  const battle = tasks.find((task) => task.status === "doing");

  async function mutate(changed: Task[], remove?: string) {
    if (remove) {
      storeRef.current.remove(remove);
      await repoRef.current.remove(remove);
    }
    await save(changed);
    refresh();
  }

  function move(task: Task, status: Task["status"]) {
    const changed = status === "doing"
      ? Object.values(storeRef.current.startBattle(task.id))
      : [storeRef.current.updateStatus(task.id, status)];
    void mutate(changed.filter((item): item is Task => Boolean(item)));
  }

  return (
    <main className="desktop-app">
      <header className="desktop-header">
        <div><p className="desktop-eyebrow">TasksOrg / Desktop</p><h1>Seu próximo passo</h1></div>
        <div className="desktop-actions">
          <Button variant="secondary" onClick={() => setTheme(theme === "castelo" ? "pergaminho" : "castelo")}>Tema {theme === "castelo" ? "Pergaminho" : "Castelo"}</Button>
          <Button variant="secondary" onClick={() => { const next = !alwaysOnTop; setAlwaysOnTop(next); void window.desktop?.setAlwaysOnTop(next); }}>{alwaysOnTop ? "Fixada" : "Fixar janela"}</Button>
        </div>
      </header>
      <div className="desktop-hud">
        <ScopeTabs id="desktop-scope" value={scope} onChange={setScope} counts={counts} />
        <StatBar label="Missões concluídas" value={tasks.filter((task) => task.status === "done").length} max={Math.max(5, tasks.length)} />
        <form onSubmit={(event) => { event.preventDefault(); const value = title.trim(); if (!value) return; const task = storeRef.current.add({ title: value, scope, priority }); void mutate([task]); setTitle(""); }}>
          <label className="sr-only" htmlFor="desktop-new-task">Nova missão</label>
          <input id="desktop-new-task" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nova missão..." maxLength={160} />
          <select aria-label="Prioridade" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select>
          <Button type="submit">Criar</Button>
        </form>
      </div>
      {error && <p className="desktop-error" role="alert">{error}</p>}
      <div className="desktop-grid" id={`desktop-scope-panel-${scope}`} role="tabpanel" aria-labelledby={`desktop-scope-tab-${scope}`}>
        {(["todo", "doing", "done"] as const).map((status) => (
          <Panel key={status} title={{ todo: "Missões", doing: "Em batalha", done: "Conquistas" }[status]} className="desktop-column">
            {visible.filter((task) => task.status === status).map((task) => (
              <TaskCard key={task.id} title={task.title} status={task.status} priority={task.priority} pomodoros={task.pomodoros} actions={
                <div className="desktop-card-actions">
                  {status !== "doing" && status !== "done" && <Button onClick={() => move(task, "doing")}>Batalhar</Button>}
                  {status === "doing" && <Button onClick={() => move(task, "done")}>Concluir</Button>}
                  {status === "done" && <Button variant="secondary" onClick={() => move(task, "todo")}>Reabrir</Button>}
                  <Button variant="danger" onClick={() => void mutate([], task.id)}>Excluir</Button>
                </div>
              } />
            ))}
            {!visible.some((task) => task.status === status) && <p className="desktop-empty">Nenhuma missão nesta coluna.</p>}
          </Panel>
        ))}
        <aside className="desktop-sidebar">
          <PomodoroHUD snapshot={pomo.snapshot} config={config} battleTitle={battle?.title} onToggle={pomo.toggle} onReset={pomo.reset} onSkip={pomo.skip} />
          <Panel title={`Escopo: ${labels[scope]}`}><p>As missões são salvas localmente e continuam disponíveis ao reabrir o app.</p></Panel>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<DesktopApp />);
