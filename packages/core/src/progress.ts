import type { Task } from "./task.js";

/**
 * Histórico de conclusões que alimenta o mapa (RoomMap): cada dia e cada mês é
 * uma "sala" com nível de exploração de 0 (nada) a 3 (tudo explorado).
 *
 * Calculado a partir do `completedAt` das tarefas, no fuso local de quem roda o
 * app. Tarefas apagadas ou reabertas saem do histórico; guardar o histórico à
 * parte fica para o MVP 2 (tabela daily_progress).
 */

export type ProgressLevel = 0 | 1 | 2 | 3;

/** Conclusões mínimas no dia para os níveis 1, 2 e 3. */
export type DayThresholds = readonly [number, number, number];
export const DEFAULT_DAY_THRESHOLDS: DayThresholds = [1, 3, 5];

export interface DayProgress {
  /** Data local, YYYY-MM-DD. */
  date: string;
  completed: number;
  level: ProgressLevel;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthProgress {
  /** YYYY-MM. */
  month: string;
  completed: number;
  /** Dias do mês com ao menos uma conclusão. */
  activeDays: number;
  /** Dias do mês que já passaram (até hoje, inclusive). Meses futuros: 0. */
  elapsedDays: number;
  level: ProgressLevel;
  isCurrent: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Chave do dia no fuso local: YYYY-MM-DD. */
export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Quantas tarefas foram concluídas em cada dia (fuso local). */
export function completionsByDay(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== "done" || !task.completedAt) continue;
    const date = new Date(task.completedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = toDayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function dayLevel(completed: number, thresholds: DayThresholds = DEFAULT_DAY_THRESHOLDS): ProgressLevel {
  if (completed >= thresholds[2]) return 3;
  if (completed >= thresholds[1]) return 2;
  if (completed >= thresholds[0]) return 1;
  return 0;
}

/** Nível do mês pela proporção de dias ativos entre os que já passaram. */
export function monthLevel(activeDays: number, elapsedDays: number): ProgressLevel {
  if (activeDays === 0 || elapsedDays === 0) return 0;
  const ratio = activeDays / elapsedDays;
  if (ratio >= 2 / 3) return 3;
  if (ratio >= 1 / 3) return 2;
  return 1;
}

/** Os 7 dias da semana de `today`, de segunda a domingo. */
export function weekProgress(tasks: Task[], today: Date, thresholds: DayThresholds = DEFAULT_DAY_THRESHOLDS): DayProgress[] {
  const counts = completionsByDay(tasks);
  const todayKey = toDayKey(today);
  const mondayOffset = (today.getDay() + 6) % 7; // getDay(): domingo = 0
  const days: DayProgress[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + i);
    const date = toDayKey(day);
    const completed = counts.get(date) ?? 0;
    days.push({ date, completed, level: dayLevel(completed, thresholds), isToday: date === todayKey, isFuture: date > todayKey });
  }
  return days;
}

/** Os 12 meses de `year`, para o mapa do ano. */
export function yearProgress(tasks: Task[], year: number, today: Date): MonthProgress[] {
  const counts = completionsByDay(tasks);
  const todayKey = toDayKey(today);
  const months: MonthProgress[] = [];
  for (let m = 0; m < 12; m++) {
    const prefix = `${year}-${pad(m + 1)}`;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    let completed = 0;
    let activeDays = 0;
    let elapsedDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${prefix}-${pad(d)}`;
      if (key > todayKey) break;
      elapsedDays++;
      const count = counts.get(key) ?? 0;
      completed += count;
      if (count > 0) activeDays++;
    }
    months.push({
      month: prefix,
      completed,
      activeDays,
      elapsedDays,
      level: monthLevel(activeDays, elapsedDays),
      isCurrent: todayKey.startsWith(prefix),
    });
  }
  return months;
}
