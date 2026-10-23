import { describe, expect, it, vi } from "vitest";
import { creditFocusToBattle } from "../focus-credit.js";
import {
  DEFAULT_POMODORO_CONFIG,
  PomodoroTimer,
  catchUpSeconds,
  normalizePomodoroConfig,
  parsePomodoroSavedState,
} from "../pomodoro.js";
import { TaskStore } from "../task.js";

const T0 = 1_700_000_000_000; // um instante fixo, em ms

describe("configuração dos tempos (T1.3.6)", () => {
  it("normaliza: completa o que falta, arredonda e respeita os limites", () => {
    expect(normalizePomodoroConfig({ focusMinutes: 50.4, shortBreakMinutes: 0, longBreakMinutes: 999 })).toEqual({
      focusMinutes: 50,
      shortBreakMinutes: 1,
      longBreakMinutes: 90,
      cyclesBeforeLongBreak: 4,
    });
  });

  it("ignora valores que não são número e entradas que não são objeto", () => {
    expect(normalizePomodoroConfig({ focusMinutes: "30", cyclesBeforeLongBreak: Number.NaN })).toEqual(DEFAULT_POMODORO_CONFIG);
    expect(normalizePomodoroConfig(null)).toEqual(DEFAULT_POMODORO_CONFIG);
  });

  it("o construtor também normaliza", () => {
    expect(new PomodoroTimer({ focusMinutes: -5 }).getConfig().focusMinutes).toBe(1);
  });

  it("parado, setConfig já mostra o novo tempo de Foco", () => {
    const timer = new PomodoroTimer();
    timer.setConfig({ focusMinutes: 50 });
    expect(timer.getSnapshot().remainingSeconds).toBe(50 * 60);
  });

  it("rodando, o novo tempo vale a partir da próxima fase", () => {
    const timer = new PomodoroTimer({ focusMinutes: 25, shortBreakMinutes: 5 });
    timer.start();
    timer.tick(60);
    timer.setConfig({ focusMinutes: 50, shortBreakMinutes: 10 });
    expect(timer.getSnapshot().remainingSeconds).toBe(24 * 60);
    timer.tick(24 * 60);
    expect(timer.getSnapshot()).toMatchObject({ phase: "shortBreak", remainingSeconds: 10 * 60 });
  });

  it("encurtar a fase atual corta o restante para o novo tamanho", () => {
    const timer = new PomodoroTimer({ focusMinutes: 25 });
    timer.start();
    timer.setConfig({ focusMinutes: 10 });
    expect(timer.getSnapshot().remainingSeconds).toBe(10 * 60);
  });
});

describe("pular fase", () => {
  it("pular um Foco vai para a pausa curta sem contar ciclo", () => {
    const timer = new PomodoroTimer({ cyclesBeforeLongBreak: 1 });
    const listener = vi.fn();
    timer.onPhaseChange(listener);
    timer.skip();
    expect(timer.getSnapshot()).toMatchObject({ phase: "shortBreak", completedFocusCycles: 0 });
    expect(listener).toHaveBeenCalledWith({ from: "focus", to: "shortBreak", reason: "skipped", completedFocusCycles: 0 });
  });

  it("pular uma pausa volta para o Foco", () => {
    const timer = new PomodoroTimer();
    timer.skip();
    timer.skip();
    expect(timer.getSnapshot()).toMatchObject({ phase: "focus", remainingSeconds: 25 * 60 });
  });

  it("Foco pulado não credita pomodoro na missão em batalha", () => {
    const timer = new PomodoroTimer();
    const store = new TaskStore();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);
    creditFocusToBattle(timer, store);
    timer.skip();
    expect(store.get(task.id)?.pomodoros).toBe(0);
  });
});

describe("salvar e retomar (T1.3.1)", () => {
  it("save + fromSaved devolve o mesmo estado e a mesma configuração", () => {
    const timer = new PomodoroTimer({ focusMinutes: 30 });
    timer.start();
    timer.tick(100);
    const saved = timer.save(T0);
    const restored = PomodoroTimer.fromSaved(saved);
    expect(restored.getSnapshot()).toEqual(timer.getSnapshot());
    expect(restored.getConfig().focusMinutes).toBe(30);
    expect(saved).toMatchObject({ version: 1, savedAt: T0 });
  });

  it("o estado salvo sobrevive a JSON (localStorage)", () => {
    const saved = new PomodoroTimer().save(T0);
    expect(parsePomodoroSavedState(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it("parse rejeita dados inválidos", () => {
    const ok = new PomodoroTimer().save(T0);
    expect(parsePomodoroSavedState(null)).toBeNull();
    expect(parsePomodoroSavedState({ ...ok, version: 2 })).toBeNull();
    expect(parsePomodoroSavedState({ ...ok, phase: "almoço" })).toBeNull();
    expect(parsePomodoroSavedState({ ...ok, remainingSeconds: -1 })).toBeNull();
    expect(parsePomodoroSavedState({ ...ok, savedAt: "ontem" })).toBeNull();
  });

  it("catchUpSeconds desconta o tempo que passou com o timer rodando", () => {
    const timer = new PomodoroTimer();
    timer.start();
    const saved = timer.save(T0);
    expect(catchUpSeconds(saved, T0 + 90_500)).toBe(90);
  });

  it("parado ou pausado, nada é descontado", () => {
    const timer = new PomodoroTimer();
    expect(catchUpSeconds(timer.save(T0), T0 + 600_000)).toBe(0);
    timer.start();
    timer.pause();
    expect(catchUpSeconds(timer.save(T0), T0 + 600_000)).toBe(0);
  });

  it("relógio do sistema voltando no tempo não gera tempo negativo", () => {
    const timer = new PomodoroTimer();
    timer.start();
    expect(catchUpSeconds(timer.save(T0), T0 - 60_000)).toBe(0);
  });

  it("app fechado por horas: conclui só o Foco em andamento e credita 1, não vários", () => {
    const timer = new PomodoroTimer();
    timer.start();
    timer.tick(20 * 60); // faltam 5 min de Foco
    const saved = timer.save(T0);

    const store = new TaskStore();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);

    const restored = PomodoroTimer.fromSaved(saved);
    creditFocusToBattle(restored, store); // inscreve antes de descontar
    restored.tick(catchUpSeconds(saved, T0 + 8 * 60 * 60 * 1000));

    expect(store.get(task.id)?.pomodoros).toBe(1);
    expect(restored.getSnapshot()).toMatchObject({ phase: "shortBreak", remainingSeconds: 5 * 60, completedFocusCycles: 1, state: "running" });
  });

  it("fromSaved não deixa o restante passar do tamanho da fase", () => {
    const saved = { ...new PomodoroTimer({ focusMinutes: 10 }).save(T0), remainingSeconds: 99_999 };
    expect(PomodoroTimer.fromSaved(saved).getSnapshot().remainingSeconds).toBe(10 * 60);
  });
});
