// @vitest-environment jsdom
import { type KeyValueStorage, type PomodoroTimer, TaskStore, creditFocusToBattle } from "@tasksorg/core";
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePomodoro, usePomodoroSettings } from "../src/hooks.js";

function memoryStorage(): KeyValueStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

/** Relógio falso: o teste decide quanto tempo passou. */
function fakeClock(start = 1_700_000_000_000) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Avança o relógio real E dispara os setInterval pendentes. */
function passTime(clock: ReturnType<typeof fakeClock>, ms: number) {
  act(() => {
    clock.advance(ms);
    vi.advanceTimersByTime(ms);
  });
}

describe("usePomodoro (T1.3.1)", () => {
  it("começa parado em 25:00 e conta enquanto roda", () => {
    const clock = fakeClock();
    const { result } = renderHook(() => usePomodoro({ storage: null, now: clock.now }));
    expect(result.current.snapshot).toMatchObject({ phase: "focus", state: "idle", remainingSeconds: 25 * 60 });

    act(() => result.current.start());
    passTime(clock, 3000);
    expect(result.current.snapshot.remainingSeconds).toBe(25 * 60 - 3);
  });

  it("aba em segundo plano: mesmo com o intervalo atrasado, o relógio segue o tempo real", () => {
    const clock = fakeClock();
    const { result } = renderHook(() => usePomodoro({ storage: null, now: clock.now }));
    act(() => result.current.start());

    // O navegador só deixou o intervalo rodar uma vez em 90 s.
    act(() => {
      clock.advance(90_000);
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.snapshot.remainingSeconds).toBe(25 * 60 - 90);
  });

  it("toggle pausa e continua; pausado não conta", () => {
    const clock = fakeClock();
    const { result } = renderHook(() => usePomodoro({ storage: null, now: clock.now }));
    act(() => result.current.toggle());
    passTime(clock, 10_000);
    act(() => result.current.toggle());
    expect(result.current.snapshot.state).toBe("paused");
    passTime(clock, 60_000);
    expect(result.current.snapshot.remainingSeconds).toBe(25 * 60 - 10);
  });

  it("reset volta ao início e skip pula a fase", () => {
    const clock = fakeClock();
    const { result } = renderHook(() => usePomodoro({ storage: null, now: clock.now }));
    act(() => result.current.start());
    passTime(clock, 5000);
    act(() => result.current.skip());
    expect(result.current.snapshot.phase).toBe("shortBreak");
    act(() => result.current.reset());
    expect(result.current.snapshot).toMatchObject({ phase: "focus", state: "idle", remainingSeconds: 25 * 60, completedFocusCycles: 0 });
  });

  it("avisa a troca de fase", () => {
    const clock = fakeClock();
    const onPhaseChange = vi.fn();
    const { result } = renderHook(() => usePomodoro({ storage: null, now: clock.now, config: { focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1, cyclesBeforeLongBreak: 4 }, onPhaseChange }));
    act(() => result.current.start());
    passTime(clock, 60_000);
    expect(onPhaseChange).toHaveBeenCalledWith(expect.objectContaining({ from: "focus", to: "shortBreak", reason: "completed" }));
  });

  it("recarregar a página: retoma do ponto certo, descontando o tempo que passou", () => {
    const clock = fakeClock();
    const storage = memoryStorage();
    const first = renderHook(() => usePomodoro({ storage, now: clock.now }));
    act(() => first.result.current.start());
    passTime(clock, 60_000);
    first.unmount(); // fechou a aba com 24:00 no relógio

    clock.advance(4 * 60_000); // ficou 4 min fechada
    const second = renderHook(() => usePomodoro({ storage, now: clock.now }));
    expect(second.result.current.snapshot).toMatchObject({ phase: "focus", state: "running", remainingSeconds: 20 * 60 });
  });

  it("fechado por horas: credita só o Foco em andamento, via attach", () => {
    const clock = fakeClock();
    const storage = memoryStorage();
    const store = new TaskStore();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);
    const attach = (timer: PomodoroTimer) => creditFocusToBattle(timer, store);

    const first = renderHook(() => usePomodoro({ storage, now: clock.now, attach }));
    act(() => first.result.current.start());
    first.unmount();

    clock.advance(8 * 60 * 60_000);
    const second = renderHook(() => usePomodoro({ storage, now: clock.now, attach }));
    expect(store.get(task.id)?.pomodoros).toBe(1);
    expect(second.result.current.snapshot).toMatchObject({ phase: "shortBreak", completedFocusCycles: 1 });
  });

  it("StrictMode (Next em desenvolvimento) monta duas vezes sem creditar em dobro", () => {
    const clock = fakeClock();
    const storage = memoryStorage();
    const store = new TaskStore();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);
    const attach = (timer: PomodoroTimer) => creditFocusToBattle(timer, store);

    const first = renderHook(() => usePomodoro({ storage, now: clock.now, attach }), { wrapper: StrictMode });
    act(() => first.result.current.start());
    first.unmount();

    clock.advance(30 * 60_000);
    renderHook(() => usePomodoro({ storage, now: clock.now, attach }), { wrapper: StrictMode });
    expect(store.get(task.id)?.pomodoros).toBe(1);
  });

  it("pausado continua pausado depois de recarregar, sem perder tempo", () => {
    const clock = fakeClock();
    const storage = memoryStorage();
    const first = renderHook(() => usePomodoro({ storage, now: clock.now }));
    act(() => first.result.current.start());
    passTime(clock, 30_000);
    act(() => first.result.current.pause());
    first.unmount();

    clock.advance(60 * 60_000);
    const second = renderHook(() => usePomodoro({ storage, now: clock.now }));
    expect(second.result.current.snapshot).toMatchObject({ state: "paused", remainingSeconds: 25 * 60 - 30 });
  });

  it("trocar os tempos parado já mostra o novo Foco", () => {
    const clock = fakeClock();
    const { result, rerender } = renderHook((props: { focus: number }) =>
      usePomodoro({ storage: null, now: clock.now, config: { focusMinutes: props.focus, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 } }),
      { initialProps: { focus: 25 } },
    );
    rerender({ focus: 50 });
    expect(result.current.snapshot.remainingSeconds).toBe(50 * 60);
  });
});

describe("usePomodoroSettings (T1.3.6)", () => {
  it("começa no padrão e salva as mudanças normalizadas", () => {
    const storage = memoryStorage();
    const { result } = renderHook(() => usePomodoroSettings({ storage }));
    expect(result.current.config).toEqual({ focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 });

    act(() => result.current.update({ focusMinutes: 45.6, cyclesBeforeLongBreak: 0 }));
    expect(result.current.config).toMatchObject({ focusMinutes: 46, cyclesBeforeLongBreak: 1 });
    expect(JSON.parse(storage.data["tasksorg:pomodoro-config"]!)).toMatchObject({ focusMinutes: 46 });
  });

  it("lê o que foi salvo antes e volta ao padrão", () => {
    const storage = memoryStorage();
    storage.setItem("tasksorg:pomodoro-config", JSON.stringify({ focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, cyclesBeforeLongBreak: 3 }));
    const { result } = renderHook(() => usePomodoroSettings({ storage }));
    expect(result.current.config.focusMinutes).toBe(50);

    act(() => result.current.restoreDefaults());
    expect(result.current.config.focusMinutes).toBe(25);
  });

  it("usa o localStorage do navegador por padrão", () => {
    window.localStorage.clear();
    const { result } = renderHook(() => usePomodoroSettings());
    act(() => result.current.update({ shortBreakMinutes: 7 }));
    expect(JSON.parse(window.localStorage.getItem("tasksorg:pomodoro-config")!).shortBreakMinutes).toBe(7);
  });
});
