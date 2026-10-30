"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createLocalStorageTaskRepository, TaskStore, type PomodoroTimer, type Task } from "@tasksorg/core";
import { Button, usePomodoro, usePomodoroSettings } from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";
import "./foco.css";

const labels = { focus: "Foco", shortBreak: "Pausa curta", longBreak: "Pausa longa" };
export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sound, setSound] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const storeRef = useRef(new TaskStore());
  const repoRef = useRef<ReturnType<typeof createLocalStorageTaskRepository> | null>(null);
  const loadedRef = useRef(false);
  const pendingCreditsRef = useRef(0);
  const { config } = usePomodoroSettings();
  const attach = useCallback((timer: PomodoroTimer) => timer.onPhaseChange((change) => {
    if (change.from !== "focus" || change.reason !== "completed") return;
    if (!loadedRef.current) { pendingCreditsRef.current += 1; return; }
    const battle = storeRef.current.getBattle();
    if (!battle) return;
    const task = storeRef.current.addPomodoro(battle.id);
    setTasks(storeRef.current.list());
    void repoRef.current?.save(task).catch(() => undefined);
  }), []);
  const onPhaseChange = useCallback((change: { to: keyof typeof labels }) => {
    if (notifications && typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("TasksOrg", { body: `Hora de ${labels[change.to].toLowerCase()}.` });
    if (sound) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.value = 660;
      oscillator.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => { void context.close(); };
    }
  }, [notifications, sound]);
  const pomo = usePomodoro({ config, attach, onPhaseChange });
  useEffect(() => {
    try { const theme = window.localStorage.getItem("tasksorg:theme"); if (theme === "castelo" || theme === "pergaminho") document.documentElement.dataset.theme = theme; } catch { /* tema padrão */ }
    try { const repo = createLocalStorageTaskRepository(window.localStorage); repoRef.current = repo; void repo.list().then((items) => {
      storeRef.current = new TaskStore(items);
      loadedRef.current = true;
      const battle = storeRef.current.getBattle();
      if (battle && pendingCreditsRef.current) {
        let updated = battle;
        for (let i = 0; i < pendingCreditsRef.current; i++) updated = storeRef.current.addPomodoro(battle.id);
        void repo.save(updated).catch(() => undefined);
      }
      pendingCreditsRef.current = 0;
      setTasks(storeRef.current.list());
    }).catch(() => { loadedRef.current = true; pendingCreditsRef.current = 0; }); } catch { loadedRef.current = true; pendingCreditsRef.current = 0; }
  }, []);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.code === "Space" && !(event.target instanceof HTMLElement && event.target.closest("button, a, input"))) { event.preventDefault(); pomo.toggle(); }
      if (event.key.toLowerCase() === "f" && !(event.target instanceof HTMLElement && event.target.closest("button, a, input"))) window.location.assign("/");
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [pomo]);
  const battle = tasks.find((task) => task.status === "doing");
  const next = tasks.filter((task) => task.status === "todo").slice(0, 3);
  const remaining = pomo.snapshot.remainingSeconds;
  return <main className="focus-screen"><header><Link href="/">← Voltar ao Quadro</Link><span>TasksOrg / Modo foco</span></header><div className="focus-center"><p>{labels[pomo.snapshot.phase]}</p><h1 aria-label={`${Math.floor(remaining / 60)} minutos e ${remaining % 60} segundos`}>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</h1><h2>{battle?.title ?? "Escolha uma missão no Quadro"}</h2><div className="focus-controls"><Button onClick={pomo.toggle}>{pomo.snapshot.state === "running" ? "Pausar" : "Iniciar"}</Button><Button variant="secondary" onClick={pomo.reset}>Reiniciar</Button><Button variant="secondary" onClick={pomo.skip}>Pular fase</Button></div><div className="focus-options"><label><input type="checkbox" checked={sound} onChange={(event) => setSound(event.target.checked)} /> Som 8-bit</label><label><input type="checkbox" checked={notifications} onChange={(event) => { if (event.target.checked && typeof Notification !== "undefined") void Notification.requestPermission().then((result) => setNotifications(result === "granted")); else setNotifications(false); }} /> Notificações</label></div></div><aside><h2>Próximas missões</h2>{next.length ? <ol>{next.map((task) => <li key={task.id}>{task.title}</li>)}</ol> : <p>Nenhuma missão na fila.</p>}</aside></main>;
}
