"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PomodoroPhaseChange } from "@tasksorg/core";

const phaseLabels = { focus: "Foco", shortBreak: "Pausa curta", longBreak: "Pausa longa" };

export function usePhaseAlerts() {
  const [sound, setSound] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => () => { if (audioRef.current) void audioRef.current.close(); audioRef.current = null; }, []);

  const toggleSound = useCallback((enabled: boolean) => {
    if (enabled && typeof AudioContext === "undefined") { setSound(false); return; }
    setSound(enabled);
    if (enabled) {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume().catch(() => undefined);
    } else if (!enabled && audioRef.current) {
      void audioRef.current.close();
      audioRef.current = null;
    }
  }, []);

  const toggleNotifications = useCallback((enabled: boolean) => {
    if (!enabled) { setNotifications(false); return; }
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission().then((permission) => setNotifications(permission === "granted")).catch(() => setNotifications(false));
  }, []);

  const onPhaseChange = useCallback((change: PomodoroPhaseChange) => {
    if (notifications && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("TasksOrg", { body: `Hora de ${phaseLabels[change.to].toLowerCase()}.` });
    }
    const context = audioRef.current;
    if (!sound || !context) return;
    void context.resume().then(() => {
      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.value = change.to === "focus" ? 880 : 660;
      oscillator.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
    }).catch(() => undefined);
  }, [notifications, sound]);

  return { sound, notifications, toggleSound, toggleNotifications, onPhaseChange };
}

export function PhaseAlertOptions({ alerts }: { alerts: ReturnType<typeof usePhaseAlerts> }) {
  return <div className="phase-alert-options">
    <label><input type="checkbox" checked={alerts.sound} onChange={(event) => alerts.toggleSound(event.target.checked)} /> Som 8-bit</label>
    <label><input type="checkbox" checked={alerts.notifications} onChange={(event) => alerts.toggleNotifications(event.target.checked)} /> Notificações</label>
  </div>;
}
