import { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import {
  PomodoroTimer,
  TaskStore,
  createHttpTaskRepository,
  creditFocusToBattle,
  type PomodoroSnapshot,
  type Task,
  type TaskRepository,
  type TaskScope,
  type TaskStatus,
} from "@tasksorg/core";
import { createNativeComponents, type NativeThemeName } from "@tasksorg/ui/native";
import { resumoDoEscopo, tarefasDaColuna } from "./src/resumo";
import { authenticate, mobileApiUrl, revokeSession } from "./src/api";

const scopes: { value: TaskScope; label: string }[] = [
  { value: "daily", label: "Hoje" },
  { value: "weekly", label: "Semana" },
  { value: "yearly", label: "Ano" },
];

const columns: { value: TaskStatus; label: string; empty: string }[] = [
  { value: "todo", label: "Missões", empty: "Nenhuma missão aguardando." },
  { value: "doing", label: "Em batalha", empty: "Nenhuma missão em batalha." },
  { value: "done", label: "Conquistas", empty: "Nenhuma missão conquistada." },
];

const phaseLabels = { focus: "Foco", shortBreak: "Pausa curta", longBreak: "Pausa longa" } as const;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

interface BoardProps {
  initialTasks: Task[];
  repository: TaskRepository;
  onLogout(): void;
}

function Board({ initialTasks, repository, onLogout }: BoardProps) {
  const [store] = useState(() => new TaskStore(initialTasks));
  const [timer] = useState(() => new PomodoroTimer());
  const [timerSnapshot, setTimerSnapshot] = useState<PomodoroSnapshot>(() => timer.getSnapshot());
  const [themeName, setThemeName] = useState<NativeThemeName>("castelo");
  const [scope, setScope] = useState<TaskScope>("daily");
  const [column, setColumn] = useState<TaskStatus>("todo");
  const [title, setTitle] = useState("");
  const [syncMessage, setSyncMessage] = useState("Sincronizado");
  const [, setRevision] = useState(0);
  const ui = useMemo(() => createNativeComponents({ View, Text, Pressable }, themeName), [themeName]);

  useEffect(() => creditFocusToBattle(timer, store, () => {
    setRevision((value) => value + 1);
    const battle = store.getBattle();
    if (battle) void syncTask(battle);
  }), [store, timer]);

  useEffect(() => {
    const interval = setInterval(() => {
      timer.tick();
      setTimerSnapshot(timer.getSnapshot());
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const scopeTasks = store.list({ scope, sort: "priority" });
  const tasks = tarefasDaColuna(scopeTasks, column);
  const summary = resumoDoEscopo(scopeTasks, scope);
  const activeTask = store.getBattle();
  const total = scopeTasks.length;

  function refreshTasks() {
    setRevision((value) => value + 1);
  }

  async function syncTask(task: Task) {
    setSyncMessage("Sincronizando…");
    try {
      await repository.save(task);
      setSyncMessage("Sincronizado");
    } catch {
      setSyncMessage("Sem conexão — tente novamente");
    }
  }

  function addTask() {
    if (!title.trim()) return;
    const task = store.add({ title, scope });
    setTitle("");
    setColumn("todo");
    refreshTasks();
    void syncTask(task);
  }

  function changeTimer(action: "toggle" | "skip" | "reset") {
    if (action === "toggle") {
      if (timerSnapshot.state === "running") timer.pause();
      else timer.start();
    } else if (action === "skip") timer.skip();
    else timer.reset();
    setTimerSnapshot(timer.getSnapshot());
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ui.theme.colors.bg }}>
      <StatusBar style={themeName === "castelo" ? "light" : "dark"} />
      <ScrollView style={ui.theme.styles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Text style={ui.theme.styles.panelTitle}>TasksOrg</Text>
          <View style={{ gap: 6, alignItems: "flex-end" }}>
            <Text style={ui.theme.styles.taskMeta}>{syncMessage}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ui.Button variant="secondary" onPress={() => setThemeName(themeName === "castelo" ? "pergaminho" : "castelo")}>
                {themeName === "castelo" ? "Pergaminho" : "Castelo"}
              </ui.Button>
              <ui.Button variant="secondary" onPress={onLogout}>Sair</ui.Button>
            </View>
          </View>
        </View>

        <ui.Panel title={phaseLabels[timerSnapshot.phase]}>
          <View style={{ gap: 12 }}>
            <Text style={{ ...ui.theme.styles.taskTitle, fontSize: 48, lineHeight: 56, textAlign: "center" }}>{formatTime(timerSnapshot.remainingSeconds)}</Text>
            <Text style={ui.theme.styles.taskMeta}>{activeTask ? `Em batalha: ${activeTask.title}` : "Escolha uma missão para batalhar"}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ui.Button style={{ flex: 1 }} onPress={() => changeTimer("toggle")}>
                {timerSnapshot.state === "running" ? "Pausar" : "Iniciar"}
              </ui.Button>
              <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => changeTimer("skip")}>Pular</ui.Button>
            </View>
            <ui.Button variant="secondary" onPress={() => changeTimer("reset")}>Reiniciar</ui.Button>
          </View>
        </ui.Panel>

        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 8 }}>
          {scopes.map((item) => (
            <ui.Button
              key={item.value}
              variant={scope === item.value ? "primary" : "secondary"}
              style={{ flex: 1 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === item.value }}
              onPress={() => setScope(item.value)}
            >
              {item.label}
            </ui.Button>
          ))}
        </View>

        <View accessibilityRole="tablist" accessibilityLabel="Colunas do quadro" style={{ flexDirection: "row", gap: 8 }}>
          {columns.map((item) => (
            <ui.Button
              key={item.value}
              variant={column === item.value ? "primary" : "secondary"}
              style={{ flex: 1 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: column === item.value }}
              onPress={() => setColumn(item.value)}
            >
              {item.label} · {summary[item.value]}
            </ui.Button>
          ))}
        </View>

        <ui.Panel title={`${columns.find((item) => item.value === column)?.label} · ${scopes.find((item) => item.value === scope)?.label}`}>
          <View style={{ gap: 12 }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={addTask}
              placeholder="Nova missão"
              placeholderTextColor={ui.theme.colors.inkMuted}
              accessibilityLabel="Nova missão"
              maxLength={120}
              returnKeyType="done"
              style={{ ...ui.theme.styles.taskTitle, ...ui.theme.styles.panel, padding: 12 }}
            />
            <ui.Button disabled={!title.trim()} onPress={addTask}>Criar missão</ui.Button>
            <ui.StatBar label="Conquistadas" value={summary.done} max={Math.max(1, total)} tone="moss" />

            {tasks.length === 0 ? <Text style={ui.theme.styles.taskMeta}>{columns.find((item) => item.value === column)?.empty}</Text> : null}
            {tasks.map((task) => (
              <ui.TaskCard key={task.id} title={task.title} status={task.status} priority={task.priority} pomodoros={task.pomodoros}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {task.status !== "doing" && task.status !== "done" ? (
                    <ui.Button style={{ flex: 1 }} onPress={() => { const changed = store.startBattle(task.id); refreshTasks(); void syncTask(changed.started); if (changed.paused) void syncTask(changed.paused); }}>Batalhar</ui.Button>
                  ) : null}
                  {task.status === "doing" ? (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { const changed = store.updateStatus(task.id, "todo"); refreshTasks(); void syncTask(changed); }}>Recuar</ui.Button>
                  ) : null}
                  {task.status !== "done" ? (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { const changed = store.complete(task.id); refreshTasks(); void syncTask(changed); }}>Concluir</ui.Button>
                  ) : (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { const changed = store.updateStatus(task.id, "todo"); refreshTasks(); void syncTask(changed); }}>Reabrir</ui.Button>
                  )}
                </View>
              </ui.TaskCard>
            ))}
          </View>
        </ui.Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

const SESSION_KEY = "tasksorg:mobile-session";

export default function App() {
  const [token, setToken] = useState<string>();
  const [initialTasks, setInitialTasks] = useState<Task[]>();
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const repository = useMemo(() => token ? createHttpTaskRepository({ baseUrl: mobileApiUrl, fetch, getToken: () => token }) : undefined, [token]);

  useEffect(() => {
    void SecureStore.getItemAsync(SESSION_KEY).then((saved) => {
      if (saved) setToken(saved);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!repository) return;
    setLoading(true);
    repository.list().then(setInitialTasks).catch(() => {
      setSessionError("Não foi possível sincronizar. Confira a API e entre novamente.");
      setToken(undefined);
      void SecureStore.deleteItemAsync(SESSION_KEY);
    }).finally(() => setLoading(false));
  }, [repository]);

  async function acceptToken(nextToken: string) {
    await SecureStore.setItemAsync(SESSION_KEY, nextToken);
    setSessionError("");
    setToken(nextToken);
  }

  function logout() {
    if (token) void revokeSession(token).catch(() => undefined);
    setToken(undefined);
    setInitialTasks(undefined);
    void SecureStore.deleteItemAsync(SESSION_KEY);
  }

  if (loading) return <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#15131d" }}><Text style={{ color: "#fff" }}>Carregando missões…</Text></SafeAreaView>;
  if (!token || !repository || !initialTasks) return <AuthScreen error={sessionError} onAuthenticated={acceptToken} />;
  return <Board initialTasks={initialTasks} repository={repository} onLogout={logout} />;
}

function AuthScreen({ error, onAuthenticated }: { error: string; onAuthenticated(token: string): Promise<void> }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(error);
  const [submitting, setSubmitting] = useState(false);
  const ui = useMemo(() => createNativeComponents({ View, Text, Pressable }, "castelo"), []);

  async function submit() {
    setSubmitting(true);
    setMessage("");
    try {
      const session = await authenticate(mode, { name: mode === "register" ? name : undefined, email, password });
      await onAuthenticated(session.token);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = { ...ui.theme.styles.taskTitle, ...ui.theme.styles.panel, padding: 12 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: ui.theme.colors.bg }}>
    <StatusBar style="light" />
    <ScrollView style={ui.theme.styles.screen} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: 16 }} keyboardShouldPersistTaps="handled">
      <ui.Panel title={mode === "login" ? "Entrar no castelo" : "Criar aventureiro"}>
        <View style={{ gap: 12 }}>
          {mode === "register" ? <TextInput accessibilityLabel="Nome" placeholder="Nome" placeholderTextColor={ui.theme.colors.inkMuted} value={name} onChangeText={setName} style={inputStyle} /> : null}
          <TextInput accessibilityLabel="E-mail" placeholder="E-mail" placeholderTextColor={ui.theme.colors.inkMuted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={inputStyle} />
          <TextInput accessibilityLabel="Senha" placeholder="Senha (mínimo 8 caracteres)" placeholderTextColor={ui.theme.colors.inkMuted} secureTextEntry value={password} onChangeText={setPassword} style={inputStyle} />
          {message ? <Text accessibilityRole="alert" style={{ ...ui.theme.styles.taskMeta, color: ui.theme.colors.crimson }}>{message}</Text> : null}
          <ui.Button disabled={submitting || !email.trim() || password.length < 8 || (mode === "register" && name.trim().length < 2)} onPress={() => void submit()}>{submitting ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}</ui.Button>
          <ui.Button variant="secondary" onPress={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>{mode === "login" ? "Criar conta" : "Já tenho conta"}</ui.Button>
          <Text style={ui.theme.styles.taskMeta}>API: {mobileApiUrl}</Text>
        </View>
      </ui.Panel>
    </ScrollView>
  </SafeAreaView>;
}
