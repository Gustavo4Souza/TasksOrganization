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

/** Limites aceitos em cada campo da configuração (inteiros, inclusive). */
export const POMODORO_CONFIG_LIMITS: Record<keyof PomodoroConfig, { min: number; max: number }> = {
  focusMinutes: { min: 1, max: 120 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 90 },
  cyclesBeforeLongBreak: { min: 1, max: 12 },
};

/**
 * Completa e corrige uma configuração vinda do usuário ou do armazenamento:
 * campo ausente ou inválido usa o padrão, número fora do limite é ajustado ao
 * limite mais próximo e frações são arredondadas.
 */
export function normalizePomodoroConfig(input: unknown): PomodoroConfig {
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const config = { ...DEFAULT_POMODORO_CONFIG };
  for (const key of Object.keys(POMODORO_CONFIG_LIMITS) as (keyof PomodoroConfig)[]) {
    const value = raw[key];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const { min, max } = POMODORO_CONFIG_LIMITS[key];
    config[key] = Math.min(max, Math.max(min, Math.round(value)));
  }
  return config;
}

export interface PomodoroSnapshot {
  phase: PomodoroPhase;
  state: PomodoroState;
  remainingSeconds: number;
  completedFocusCycles: number;
}

/** Disparado quando o relógio zera e o timer passa para a próxima fase. */
export interface PomodoroPhaseChange {
  from: PomodoroPhase;
  to: PomodoroPhase;
  /** "completed": o relógio zerou. "skipped": o usuário pulou a fase (skip). */
  reason: "completed" | "skipped";
  /** Total de focos concluídos depois da troca. */
  completedFocusCycles: number;
}

export type PomodoroPhaseListener = (change: PomodoroPhaseChange) => void;

/** Estado salvo para retomar o timer depois de recarregar a página ou reabrir o app. */
export interface PomodoroSavedState extends PomodoroSnapshot {
  version: 1;
  config: PomodoroConfig;
  /** Momento do salvamento, em milissegundos (Date.now()). */
  savedAt: number;
}

const PHASES: PomodoroPhase[] = ["focus", "shortBreak", "longBreak"];
const STATES: PomodoroState[] = ["idle", "running", "paused"];

/** Valida um estado salvo (vindo do localStorage, por exemplo). Inválido: null. */
export function parsePomodoroSavedState(input: unknown): PomodoroSavedState | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const { phase, state, remainingSeconds, completedFocusCycles, savedAt } = raw;
  if (raw.version !== 1) return null;
  if (!PHASES.includes(phase as PomodoroPhase) || !STATES.includes(state as PomodoroState)) return null;
  if (typeof remainingSeconds !== "number" || !Number.isFinite(remainingSeconds) || remainingSeconds < 0) return null;
  if (typeof completedFocusCycles !== "number" || !Number.isInteger(completedFocusCycles) || completedFocusCycles < 0) return null;
  if (typeof savedAt !== "number" || !Number.isFinite(savedAt)) return null;
  return {
    version: 1,
    config: normalizePomodoroConfig(raw.config),
    phase: phase as PomodoroPhase,
    state: state as PomodoroState,
    remainingSeconds: Math.floor(remainingSeconds),
    completedFocusCycles,
    savedAt,
  };
}

/**
 * Quantos segundos descontar ao retomar um timer salvo, em `now`.
 * Só conta se ele estava rodando, e no máximo até o fim da fase em que parou:
 * quem fecha o app no meio de um Foco e volta horas depois recebe aquele Foco
 * concluído, mas não uma sequência de ciclos que não fez.
 */
export function catchUpSeconds(saved: PomodoroSavedState, now: number): number {
  if (saved.state !== "running") return 0;
  const elapsed = Math.floor((now - saved.savedAt) / 1000);
  return Math.max(0, Math.min(elapsed, saved.remainingSeconds));
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
  private listeners = new Set<PomodoroPhaseListener>();

  constructor(config: Partial<PomodoroConfig> = {}) {
    this.config = normalizePomodoroConfig({ ...DEFAULT_POMODORO_CONFIG, ...config });
    this.remainingSeconds = this.config.focusMinutes * 60;
  }

  /**
   * Recria o timer exatamente como foi salvo, sem descontar o tempo que passou.
   * Para retomar: inscreva os listeners (ex.: creditFocusToBattle) e depois chame
   * `tick(catchUpSeconds(saved, Date.now()))`, para o fim de fase ser avisado.
   */
  static fromSaved(saved: PomodoroSavedState): PomodoroTimer {
    const timer = new PomodoroTimer(saved.config);
    timer.phase = saved.phase;
    timer.state = saved.state;
    timer.remainingSeconds = Math.min(saved.remainingSeconds, timer.phaseLength(saved.phase));
    timer.completedFocusCycles = saved.completedFocusCycles;
    return timer;
  }

  save(now: number): PomodoroSavedState {
    return { version: 1, config: { ...this.config }, ...this.getSnapshot(), savedAt: now };
  }

  getConfig(): PomodoroConfig {
    return { ...this.config };
  }

  /**
   * Troca os tempos. Valem a partir da próxima fase; parado (idle), o relógio já
   * mostra o novo Foco. Se a fase atual ficou mais curta que o tempo restante, o
   * restante é cortado para o novo tamanho.
   */
  setConfig(config: Partial<PomodoroConfig>): void {
    this.config = normalizePomodoroConfig({ ...this.config, ...config });
    this.remainingSeconds =
      this.state === "idle" ? this.phaseLength(this.phase) : Math.min(this.remainingSeconds, this.phaseLength(this.phase));
  }

  /** Avisa a cada troca de fase. Devolve a função que cancela a inscrição. */
  onPhaseChange(listener: PomodoroPhaseListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
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
    this.remainingSeconds = this.phaseLength("focus");
  }

  /** Avança o relógio em `seconds` segundos (default 1). Retorna true se a fase virou. */
  tick(seconds = 1): boolean {
    if (this.state !== "running") return false;
    this.remainingSeconds = Math.max(0, this.remainingSeconds - seconds);
    if (this.remainingSeconds > 0) return false;
    this.advance("completed");
    return true;
  }

  /**
   * Pula para a próxima fase (botão "Pular fase" do Modo foco). Um Foco pulado não
   * conta como ciclo concluído e não credita pomodoro em nenhuma missão.
   */
  skip(): void {
    this.advance("skipped");
  }

  private phaseLength(phase: PomodoroPhase): number {
    const minutes =
      phase === "focus" ? this.config.focusMinutes : phase === "shortBreak" ? this.config.shortBreakMinutes : this.config.longBreakMinutes;
    return minutes * 60;
  }

  private advance(reason: PomodoroPhaseChange["reason"]): void {
    const from = this.phase;
    if (this.phase === "focus") {
      if (reason === "completed") this.completedFocusCycles += 1;
      const isLongBreak = reason === "completed" && this.completedFocusCycles % this.config.cyclesBeforeLongBreak === 0;
      this.phase = isLongBreak ? "longBreak" : "shortBreak";
    } else {
      this.phase = "focus";
    }
    this.remainingSeconds = this.phaseLength(this.phase);
    const change: PomodoroPhaseChange = { from, to: this.phase, reason, completedFocusCycles: this.completedFocusCycles };
    // Cópia: um listener pode cancelar a própria inscrição durante o aviso.
    for (const listener of [...this.listeners]) listener(change);
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
