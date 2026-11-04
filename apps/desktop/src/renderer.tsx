import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  creditFocusToBattle,
  createHttpTaskRepository,
  createOfflineTaskRepository,
  migrateTasksToRepository,
  TaskStore,
  type PomodoroSnapshot,
  type Task,
  type TaskPriority,
  type TaskRepository,
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
import { resolveInitialTheme, type ThemeName } from "./desktop-logic.js";
import { createDesktopTaskRepository, loadDesktopTasks, type DesktopTaskBridge } from "./desktop-repository.js";

declare global {
  interface Window {
    desktop?: {
      getWindowState(): Promise<{ alwaysOnTop: boolean }>;
      setAlwaysOnTop(value: boolean): Promise<boolean>;
      setTrayPomodoro(snapshot: Pick<PomodoroSnapshot, "phase" | "remainingSeconds">): void;
      readTasksFile(): Promise<string | null>;
      writeTasksFile(text: string): Promise<void>;
      readSessionToken(): Promise<string | null>;
      writeSessionToken(token: string): Promise<void>;
      clearSessionToken(): Promise<void>;
      apiRequest(request: { path: string; method?: string; body?: string; token?: string }): Promise<{ ok: boolean; status: number; body: string }>;
    };
  }
}

const scopes: TaskScope[] = ["daily", "weekly", "yearly"];
const labels: Record<TaskScope, string> = { daily: "Hoje", weekly: "Semana", yearly: "Ano" };

function initialTheme(): ThemeName {
  let saved: unknown = null;
  try {
    saved = window.localStorage.getItem("tasksorg:desktop:theme");
  } catch { /* a preferência do sistema ainda define o tema inicial */ }
  return resolveInitialTheme(saved, window.matchMedia("(prefers-color-scheme: light)").matches);
}

function DesktopApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scope, setScope] = useState<TaskScope>("daily");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const storeRef = useRef(new TaskStore());
  const bridge = window.desktop as DesktopTaskBridge;
  const localRepoRef = useRef(createDesktopTaskRepository(bridge));
  const repoRef = useRef<TaskRepository>(localRepoRef.current);
  const tokenRef = useRef<string | undefined>(undefined);
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

  const remoteRepository = useCallback(() => createHttpTaskRepository({
    baseUrl: "http://desktop.tasksorg",
    getToken: () => tokenRef.current,
    fetch: async (url, init) => {
      const parsed = new URL(url);
      const response = await window.desktop!.apiRequest({
        path: `${parsed.pathname}${parsed.search}`,
        method: init?.method,
        body: init?.body,
        token: tokenRef.current,
      });
      return { ok: response.ok, status: response.status, json: async () => response.body ? JSON.parse(response.body) : {} };
    },
  }), []);

  const syncedRepository = useCallback((remote: TaskRepository) => createOfflineTaskRepository({
    local: localRepoRef.current,
    remote,
    storage: window.localStorage,
    queueKey: "tasksorg:desktop:sync-queue",
  }), []);

  useEffect(() => {
    window.desktop?.setTrayPomodoro({
      phase: pomo.snapshot.phase,
      remainingSeconds: pomo.snapshot.remainingSeconds,
    });
  }, [pomo.snapshot.phase, pomo.snapshot.remainingSeconds]);

  useEffect(() => {
    void (async () => {
      try {
        let items = await loadDesktopTasks(localRepoRef.current, window.localStorage);
        const token = await window.desktop?.readSessionToken();
        if (token) {
          tokenRef.current = token;
          const remote = remoteRepository();
          const synced = syncedRepository(remote);
          try {
            await migrateTasksToRepository(localRepoRef.current, remote);
            items = await synced.sync();
            setAuthenticated(true);
          } catch (reason) {
            if (reason instanceof Error && reason.message.includes("401")) {
              tokenRef.current = undefined;
              await window.desktop?.clearSessionToken();
            } else {
              repoRef.current = synced;
              setAuthenticated(true);
            }
          }
          if (tokenRef.current) repoRef.current = synced;
        }
        storeRef.current = new TaskStore(items);
        refresh();
      } catch {
        setError("Não foi possível carregar as missões.");
      }
    })();
    void window.desktop?.getWindowState().then((state) => setAlwaysOnTop(state.alwaysOnTop));
  }, [refresh, remoteRepository, syncedRepository]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem("tasksorg:desktop:theme", theme); } catch { /* tema continua ativo nesta sessão */ }
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

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    const payload = authMode === "register"
      ? { name: String(form.get("name") ?? "").trim(), email: String(form.get("email") ?? "").trim().toLowerCase(), password: String(form.get("password") ?? "") }
      : { email: String(form.get("email") ?? "").trim().toLowerCase(), password: String(form.get("password") ?? "") };
    try {
      const response = await window.desktop!.apiRequest({ path: `/auth/${authMode}`, method: "POST", body: JSON.stringify(payload) });
      const body = response.body ? JSON.parse(response.body) as { token?: string; error?: string } : {};
      if (!response.ok || !body.token) throw new Error(body.error ?? "Não foi possível autenticar.");
      tokenRef.current = body.token;
      await window.desktop!.writeSessionToken(body.token);
      const remote = remoteRepository();
      await migrateTasksToRepository(localRepoRef.current, remote);
      const synced = syncedRepository(remote);
      repoRef.current = synced;
      const items = await synced.sync();
      storeRef.current = new TaskStore(items);
      setAuthenticated(true);
      refresh();
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : "Não foi possível autenticar.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    const token = tokenRef.current;
    try { if (token) await window.desktop?.apiRequest({ path: "/auth/logout", method: "POST", token }); } catch { /* sessão local ainda será encerrada */ }
    tokenRef.current = undefined;
    await window.desktop?.clearSessionToken();
    repoRef.current = localRepoRef.current;
    setAuthenticated(false);
  }

  return (
    <main className="desktop-app px-root">
      <header className="desktop-header">
        <div><p className="desktop-eyebrow">TasksOrg / Desktop</p><h1>Seu próximo passo</h1></div>
        <div className="desktop-actions">
          {authenticated ? <Button variant="secondary" onClick={() => void logout()}>Sair</Button> : null}
          <Button variant="secondary" onClick={() => setTheme(theme === "castelo" ? "pergaminho" : "castelo")}>Tema {theme === "castelo" ? "Pergaminho" : "Castelo"}</Button>
          <Button variant="secondary" onClick={() => { const next = !alwaysOnTop; setAlwaysOnTop(next); void window.desktop?.setAlwaysOnTop(next); }}>{alwaysOnTop ? "Fixada" : "Fixar janela"}</Button>
        </div>
      </header>
      {!authenticated && <Panel title={authMode === "login" ? "Entrar e sincronizar" : "Criar conta"} className="desktop-auth">
        <form onSubmit={(event) => void submitAuth(event)} aria-busy={authLoading}>
          {authMode === "register" ? <input name="name" aria-label="Nome" placeholder="Nome do aventureiro" minLength={2} maxLength={80} required disabled={authLoading} /> : null}
          <input name="email" aria-label="E-mail" placeholder="E-mail" type="email" autoComplete="email" required disabled={authLoading} />
          <input name="password" aria-label="Senha" placeholder="Senha" type="password" minLength={8} maxLength={128} required disabled={authLoading} />
          <Button type="submit" disabled={authLoading}>{authLoading ? "Aguarde…" : authMode === "login" ? "Entrar" : "Cadastrar"}</Button>
          <Button variant="secondary" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Criar conta" : "Já tenho conta"}</Button>
        </form>
        {authError ? <p className="desktop-error" role="alert">{authError}</p> : <p>Você pode continuar offline; as alterações serão enviadas quando entrar e a API estiver disponível.</p>}
      </Panel>}
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
