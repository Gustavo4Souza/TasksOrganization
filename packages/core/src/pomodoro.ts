export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";
export type PomodoroState = "idle" | "running" | "paused";

export interface PomodoroConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export interface PomodoroSnapshot {
  phase: PomodoroPhase;
  state: PomodoroState;
  remainingSeconds: number;
  completedFocusCycles: number;
}

/**
 * Máquina de estados do timer Pomodoro, sem dependência de DOM/timers reais,
 * para poder ser reaproveitada igual em web, desktop (Electron) e mobile.
 * Quem consome decide como chamar tick() (setInterval, requestAnimationFrame, etc).
 */
export class PomodoroTimer {
  private config: PomodoroConfig;
  private phase: PomodoroPhase = "focus";
  private state: PomodoroState = "idle";
  private remainingSeconds: number;
  private completedFocusCycles = 0;

  constructor(config: Partial<PomodoroConfig> = {}) {
    this.config = { ...DEFAULT_POMODORO_CONFIG, ...config };
    this.remainingSeconds = this.config.focusMinutes * 60;
  }

  start(): void {
    if (this.state === "idle" || this.state === "paused") {
      this.state = "running";
    }
  }

  pause(): void {
    if (this.state === "running") {
      this.state = "paused";
    }
  }

  reset(): void {
    this.state = "idle";
    this.phase = "focus";
    this.completedFocusCycles = 0;
    this.remainingSeconds = this.config.focusMinutes * 60;
  }

  /** Avança o relógio em `seconds` segundos (default 1). Retorna true se a fase virou. */
  tick(seconds = 1): boolean {
    if (this.state !== "running") return false;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - seconds);
    if (this.remainingSeconds > 0) return false;

    if (this.phase === "focus") {
      this.completedFocusCycles += 1;
      const isLongBreak = this.completedFocusCycles % this.config.cyclesBeforeLongBreak === 0;
      this.phase = isLongBreak ? "longBreak" : "shortBreak";
      this.remainingSeconds = (isLongBreak ? this.config.longBreakMinutes : this.config.shortBreakMinutes) * 60;
    } else {
      this.phase = "focus";
      this.remainingSeconds = this.config.focusMinutes * 60;
    }
    return true;
  }

  getSnapshot(): PomodoroSnapshot {
    return {
      phase: this.phase,
      state: this.state,
      remainingSeconds: this.remainingSeconds,
      completedFocusCycles: this.completedFocusCycles,
    };
  }
}
