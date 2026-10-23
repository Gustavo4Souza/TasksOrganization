import {
  type PomodoroConfig,
  type PomodoroSavedState,
  DEFAULT_POMODORO_CONFIG,
  normalizePomodoroConfig,
  parsePomodoroSavedState,
} from "./pomodoro.js";
import type { KeyValueStorage } from "./repository.js";

/**
 * Persistência local do Pomodoro: os tempos escolhidos pelo usuário (T1.3.6) e o
 * estado do relógio, para retomar depois de recarregar (T1.3.1).
 * O armazenamento pode falhar (aba anônima, cota cheia): ler devolve o padrão e
 * gravar devolve false, sem derrubar a tela.
 */

export const POMODORO_CONFIG_KEY = "tasksorg:pomodoro-config";
export const POMODORO_STATE_KEY = "tasksorg:pomodoro";

function readJson(storage: KeyValueStorage, key: string): unknown {
  try {
    const text = storage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

function writeJson(storage: KeyValueStorage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadPomodoroConfig(storage: KeyValueStorage, key = POMODORO_CONFIG_KEY): PomodoroConfig {
  const data = readJson(storage, key);
  return data === null ? { ...DEFAULT_POMODORO_CONFIG } : normalizePomodoroConfig(data);
}

/** Grava a configuração já normalizada e devolve o que foi gravado. */
export function savePomodoroConfig(storage: KeyValueStorage, config: Partial<PomodoroConfig>, key = POMODORO_CONFIG_KEY): PomodoroConfig {
  const normalized = normalizePomodoroConfig({ ...DEFAULT_POMODORO_CONFIG, ...config });
  writeJson(storage, key, normalized);
  return normalized;
}

export function loadPomodoroState(storage: KeyValueStorage, key = POMODORO_STATE_KEY): PomodoroSavedState | null {
  return parsePomodoroSavedState(readJson(storage, key));
}

export function savePomodoroState(storage: KeyValueStorage, state: PomodoroSavedState, key = POMODORO_STATE_KEY): boolean {
  return writeJson(storage, key, state);
}
