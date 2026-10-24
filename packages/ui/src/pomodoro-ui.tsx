"use client";

import {
  type DayProgress,
  type MonthProgress,
  type PomodoroConfig,
  type PomodoroPhase,
  type PomodoroSnapshot,
  DEFAULT_POMODORO_CONFIG,
} from "@tasksorg/core";
import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import { type Accent, Button, Panel, PixelIcon, type PixelIconName } from "./pixel.js";

const classes = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

/** Segundos em "mm:ss" (ex.: 1122 → "18:42"). */
export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const PHASES: Record<PomodoroPhase, { label: string; icon: PixelIconName; tone: Accent }> = {
  focus: { label: "Foco", icon: "sword", tone: "mana" },
  shortBreak: { label: "Save point", icon: "heart", tone: "moss" },
  longBreak: { label: "Santuário", icon: "star", tone: "arcane" },
};

function phaseSeconds(phase: PomodoroPhase, config: PomodoroConfig): number {
  const minutes =
    phase === "focus" ? config.focusMinutes : phase === "shortBreak" ? config.shortBreakMinutes : config.longBreakMinutes;
  return minutes * 60;
}

export interface PomodoroHUDProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  /** O estado do timer (usePomodoro().snapshot ou PomodoroTimer.getSnapshot()). */
  snapshot: PomodoroSnapshot;
  /** Tempos em uso, para a barra e os orbes. Padrão: 25/5/15 e 4 ciclos. */
  config?: PomodoroConfig;
  /** Título da missão em batalha; vazio mostra que nenhuma está em batalha. */
  battleTitle?: string | null;
  onToggle?: () => void;
  onReset?: () => void;
  /** Mostra o botão "Pular fase" (Modo foco). */
  onSkip?: () => void;
  title?: ReactNode;
}

/**
 * HUD do Pomodoro (T0.2.9): fase com ícone, relógio, orbes de ciclos, barra do
 * tempo restante, missão em batalha e controles. Só desenha: o estado vem por
 * prop e as ações por callback, então serve igual ao web, ao desktop e ao catálogo.
 */
export function PomodoroHUD({
  snapshot,
  config = DEFAULT_POMODORO_CONFIG,
  battleTitle,
  onToggle,
  onReset,
  onSkip,
  title = "Pomodoro",
  className,
  ...props
}: PomodoroHUDProps) {
  const phase = PHASES[snapshot.phase];
  const total = phaseSeconds(snapshot.phase, config);
  const remaining = Math.min(Math.max(0, snapshot.remainingSeconds), total);
  const fresh = remaining === total;
  const paused = snapshot.state === "paused" || (snapshot.state === "idle" && !fresh);

  const cycles = config.cyclesBeforeLongBreak;
  // No Santuário o ciclo acabou de fechar: todos os orbes acesos.
  const lit = snapshot.phase === "longBreak" && snapshot.completedFocusCycles > 0 ? cycles : snapshot.completedFocusCycles % cycles;

  const mainLabel = snapshot.state === "running" ? "Pausar" : fresh ? "Iniciar" : "Continuar";

  return (
    <Panel title={title} {...props} className={classes("px-pomo", `px-tone--${phase.tone}`, className)} data-phase={snapshot.phase}>
      <p className="px-pomo-phase">
        <PixelIcon name={phase.icon} />
        <span>
          {phase.label}
          {paused && " · pausado"}
        </span>
      </p>
      <p className="px-pomo-time" role="timer" aria-label={`${formatClock(remaining)} restantes de ${phase.label}`}>
        {formatClock(remaining)}
      </p>
      <div
        className="px-pomo-orbs"
        role="img"
        aria-label={`${lit} de ${cycles} focos até o Santuário · ${snapshot.completedFocusCycles} no total`}
      >
        {Array.from({ length: cycles }, (_, index) => (
          <span key={index} className={classes("px-pomo-orb", index < lit && "px-pomo-orb--on")} />
        ))}
      </div>
      <div
        className="px-stat-track px-pomo-bar"
        role="progressbar"
        aria-label={`Tempo restante de ${phase.label}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={remaining}
        aria-valuetext={`${formatClock(remaining)} de ${formatClock(total)}`}
      >
        <div className="px-stat-fill" style={{ width: `${total ? (remaining / total) * 100 : 0}%` }} />
      </div>
      <p className="px-pomo-battle">
        {battleTitle ? (
          <>
            Em batalha: <strong>{battleTitle}</strong>
          </>
        ) : (
          "Nenhuma missão em batalha"
        )}
      </p>
      {(onToggle || onReset || onSkip) && (
        <div className="px-pomo-controls">
          {onToggle && <Button onClick={onToggle}>{mainLabel}</Button>}
          {onSkip && (
            <Button variant="secondary" onClick={onSkip}>
              Pular fase
            </Button>
          )}
          {onReset && (
            <Button variant="secondary" onClick={onReset}>
              Resetar
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}

export type RoomLevel = 0 | 1 | 2 | 3;

export interface MapRoom {
  id: string;
  /** Letra ou número curto desenhado na sala. */
  label: string;
  /** Texto completo para leitores de tela e para o tooltip. */
  description: string;
  level: RoomLevel;
  /** Hoje / mês atual: contorno dourado por fora da sala. */
  current?: boolean;
  /** Ainda não chegou: borda tracejada. */
  future?: boolean;
}

export interface RoomMapProps extends Omit<ComponentPropsWithoutRef<"ol">, "children"> {
  rooms: MapRoom[];
  /** Nome do mapa para leitores de tela (ex.: "Semana"). */
  label: string;
  /** Salas por linha. Padrão: 7. */
  columns?: number;
}

/**
 * Mapa de salas do Metroidvania (T0.2.9): cada sala é um dia ou um mês, com nível
 * de exploração 0 a 3. O nível não depende só da cor: ele está no texto de cada
 * sala para leitores de tela e no tooltip.
 */
export function RoomMap({ rooms, label, columns = 7, className, style, ...props }: RoomMapProps) {
  return (
    <ol
      {...props}
      aria-label={label}
      className={classes("px-map", className)}
      style={{ ...style, "--px-map-cols": columns } as CSSProperties}
    >
      {rooms.map((room) => (
        <li
          key={room.id}
          className={classes("px-room", room.current && "px-room--current", room.future && "px-room--future")}
          data-level={room.level}
          aria-current={room.current ? "date" : undefined}
          title={room.description}
        >
          <span aria-hidden="true">{room.label}</span>
          <span className="px-sr-only">{room.description}</span>
        </li>
      ))}
    </ol>
  );
}

const WEEKDAYS: [string, string][] = [
  ["S", "Segunda"],
  ["T", "Terça"],
  ["Q", "Quarta"],
  ["Q", "Quinta"],
  ["S", "Sexta"],
  ["S", "Sábado"],
  ["D", "Domingo"],
];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const conquests = (n: number) => `${n} ${n === 1 ? "conquista" : "conquistas"}`;

/** Converte o weekProgress do core (segunda a domingo) em salas do mapa. */
export function roomsFromWeek(days: DayProgress[]): MapRoom[] {
  return days.map((day, index) => {
    const [letter, name] = WEEKDAYS[index % 7]!;
    const [, month, date] = day.date.split("-");
    const when = `${name}, ${date}/${month}${day.isToday ? " (hoje)" : ""}`;
    return {
      id: day.date,
      label: letter,
      level: day.level,
      current: day.isToday,
      future: day.isFuture,
      description: day.isFuture ? `${when}: ainda não chegou` : `${when}: ${conquests(day.completed)}, nível ${day.level} de 3`,
    };
  });
}

/** Converte o yearProgress do core (12 meses) em salas do mapa. */
export function roomsFromYear(months: MonthProgress[]): MapRoom[] {
  return months.map((month) => {
    const index = Number(month.month.slice(5, 7)) - 1;
    const name = `${MONTHS[index] ?? month.month}${month.isCurrent ? " (mês atual)" : ""}`;
    const future = month.elapsedDays === 0;
    return {
      id: month.month,
      label: (MONTHS[index] ?? "?").charAt(0),
      level: month.level,
      current: month.isCurrent,
      future,
      description: future
        ? `${name}: ainda não chegou`
        : `${name}: ${conquests(month.completed)} em ${month.activeDays} de ${month.elapsedDays} dias, nível ${month.level} de 3`,
    };
  });
}
