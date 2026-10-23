import { describe, expect, it } from "vitest";
import { DEFAULT_POMODORO_CONFIG, PomodoroTimer } from "../pomodoro.js";
import {
  POMODORO_CONFIG_KEY,
  loadPomodoroConfig,
  loadPomodoroState,
  savePomodoroConfig,
  savePomodoroState,
} from "../pomodoro-storage.js";
import type { KeyValueStorage } from "../repository.js";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("configuração salva localmente (T1.3.6)", () => {
  it("sem nada salvo, usa o padrão 25/5/15 e 4 ciclos", () => {
    expect(loadPomodoroConfig(memoryStorage())).toEqual(DEFAULT_POMODORO_CONFIG);
  });

  it("salva normalizado e lê de volta", () => {
    const storage = memoryStorage();
    expect(savePomodoroConfig(storage, { focusMinutes: 50, cyclesBeforeLongBreak: 99 })).toEqual({
      ...DEFAULT_POMODORO_CONFIG,
      focusMinutes: 50,
      cyclesBeforeLongBreak: 12,
    });
    expect(loadPomodoroConfig(storage).focusMinutes).toBe(50);
  });

  it("JSON corrompido volta ao padrão", () => {
    expect(loadPomodoroConfig(memoryStorage({ [POMODORO_CONFIG_KEY]: "{oops" }))).toEqual(DEFAULT_POMODORO_CONFIG);
  });

  it("armazenamento indisponível não derruba a tela", () => {
    expect(loadPomodoroConfig(brokenStorage)).toEqual(DEFAULT_POMODORO_CONFIG);
    expect(savePomodoroConfig(brokenStorage, { focusMinutes: 40 }).focusMinutes).toBe(40);
  });
});

describe("estado do relógio salvo localmente (T1.3.1)", () => {
  it("salva e lê de volta", () => {
    const storage = memoryStorage();
    const timer = new PomodoroTimer();
    timer.start();
    timer.tick(42);
    const saved = timer.save(1_700_000_000_000);
    expect(savePomodoroState(storage, saved)).toBe(true);
    expect(loadPomodoroState(storage)).toEqual(saved);
  });

  it("sem nada salvo, ou com dado inválido, devolve null", () => {
    expect(loadPomodoroState(memoryStorage())).toBeNull();
    expect(loadPomodoroState(memoryStorage({ "tasksorg:pomodoro": '{"version":9}' }))).toBeNull();
    expect(loadPomodoroState(brokenStorage)).toBeNull();
  });

  it("gravar com armazenamento indisponível devolve false", () => {
    expect(savePomodoroState(brokenStorage, new PomodoroTimer().save(0))).toBe(false);
  });
});
