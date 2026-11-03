import { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import {
  PomodoroTimer,
  TaskStore,
  creditFocusToBattle,
  type PomodoroSnapshot,
  type TaskScope,
} from "@tasksorg/core";
import { createNativeComponents, type NativeThemeName } from "@tasksorg/ui/native";
import { resumoDoEscopo } from "./src/resumo";

const scopes: { value: TaskScope; label: string }[] = [
  { value: "daily", label: "Hoje" },
  { value: "weekly", label: "Semana" },
  { value: "yearly", label: "Ano" },
];

const phaseLabels = { focus: "Foco", shortBreak: "Pausa curta", longBreak: "Pausa longa" } as const;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function App() {
  const [store] = useState(() => new TaskStore());
  const [timer] = useState(() => new PomodoroTimer());
  const [timerSnapshot, setTimerSnapshot] = useState<PomodoroSnapshot>(() => timer.getSnapshot());
  const [themeName, setThemeName] = useState<NativeThemeName>("castelo");
  const [scope, setScope] = useState<TaskScope>("daily");
  const [title, setTitle] = useState("");
  const [, setRevision] = useState(0);
  const ui = useMemo(() => createNativeComponents({ View, Text, Pressable }, themeName), [themeName]);

  useEffect(() => creditFocusToBattle(timer, store, () => setRevision((value) => value + 1)), [store, timer]);

  useEffect(() => {
    const interval = setInterval(() => {
      timer.tick();
      setTimerSnapshot(timer.getSnapshot());
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const tasks = store.list({ scope, sort: "priority" });
  const summary = resumoDoEscopo(tasks, scope);
  const activeTask = store.getBattle();
  const total = summary.todo + summary.doing + summary.done;

  function refreshTasks() {
    setRevision((value) => value + 1);
  }

  function addTask() {
    if (!title.trim()) return;
    store.add({ title, scope });
    setTitle("");
    refreshTasks();
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
          <ui.Button variant="secondary" onPress={() => setThemeName(themeName === "castelo" ? "pergaminho" : "castelo")}>
            {themeName === "castelo" ? "Pergaminho" : "Castelo"}
          </ui.Button>
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

        <ui.Panel title={`Missões · ${scopes.find((item) => item.value === scope)?.label}`}>
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

            {tasks.length === 0 ? <Text style={ui.theme.styles.taskMeta}>Nenhuma missão neste escopo.</Text> : null}
            {tasks.map((task) => (
              <ui.TaskCard key={task.id} title={task.title} status={task.status} priority={task.priority} pomodoros={task.pomodoros}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {task.status !== "doing" && task.status !== "done" ? (
                    <ui.Button style={{ flex: 1 }} onPress={() => { store.startBattle(task.id); refreshTasks(); }}>Batalhar</ui.Button>
                  ) : null}
                  {task.status === "doing" ? (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { store.updateStatus(task.id, "todo"); refreshTasks(); }}>Recuar</ui.Button>
                  ) : null}
                  {task.status !== "done" ? (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { store.complete(task.id); refreshTasks(); }}>Concluir</ui.Button>
                  ) : (
                    <ui.Button variant="secondary" style={{ flex: 1 }} onPress={() => { store.updateStatus(task.id, "todo"); refreshTasks(); }}>Reabrir</ui.Button>
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
