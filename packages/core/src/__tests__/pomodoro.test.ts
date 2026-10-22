import { beforeEach, describe, expect, it, vi } from "vitest";
import { type PomodoroPhaseChange, PomodoroTimer } from "../pomodoro.js";

describe("PomodoroTimer", () => {
  let timer: PomodoroTimer;

  beforeEach(() => {
    timer = new PomodoroTimer({
      focusMinutes: 1,
      shortBreakMinutes: 1,
      longBreakMinutes: 2,
      cyclesBeforeLongBreak: 2,
    });
  });

  it("começa parado na fase de foco", () => {
    const snap = timer.getSnapshot();
    expect(snap.state).toBe("idle");
    expect(snap.phase).toBe("focus");
    expect(snap.remainingSeconds).toBe(60);
  });

  it("não avança o tempo sem start()", () => {
    timer.tick(10);
    expect(timer.getSnapshot().remainingSeconds).toBe(60);
  });

  it("avança o tempo depois de start()", () => {
    timer.start();
    timer.tick(30);
    expect(timer.getSnapshot().remainingSeconds).toBe(30);
    expect(timer.getSnapshot().state).toBe("running");
  });

  it("troca para pausa curta ao zerar o foco", () => {
    timer.start();
    const changedPhase = timer.tick(60);
    expect(changedPhase).toBe(true);
    const snap = timer.getSnapshot();
    expect(snap.phase).toBe("shortBreak");
    expect(snap.completedFocusCycles).toBe(1);
  });

  it("troca para pausa longa após N ciclos de foco", () => {
    timer.start();
    timer.tick(60); // foco -> shortBreak
    timer.tick(60); // shortBreak -> foco
    timer.tick(60); // foco (ciclo 2) -> longBreak
    const snap = timer.getSnapshot();
    expect(snap.phase).toBe("longBreak");
    expect(snap.completedFocusCycles).toBe(2);
  });

  it("pause() impede o tick de avançar", () => {
    timer.start();
    timer.pause();
    timer.tick(10);
    expect(timer.getSnapshot().remainingSeconds).toBe(60);
    expect(timer.getSnapshot().state).toBe("paused");
  });

  it("reset() volta ao estado inicial", () => {
    timer.start();
    timer.tick(60);
    timer.reset();
    const snap = timer.getSnapshot();
    expect(snap.state).toBe("idle");
    expect(snap.phase).toBe("focus");
    expect(snap.completedFocusCycles).toBe(0);
    expect(snap.remainingSeconds).toBe(60);
  });
});

describe("evento de troca de fase (T1.1.4)", () => {
  function shortTimer() {
    const timer = new PomodoroTimer({ focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 2, cyclesBeforeLongBreak: 2 });
    timer.start();
    return timer;
  }

  it("avisa de/para e o total de focos a cada troca", () => {
    const timer = shortTimer();
    const changes: PomodoroPhaseChange[] = [];
    timer.onPhaseChange((c) => changes.push(c));

    timer.tick(60); // foco -> pausa curta
    timer.tick(60); // pausa curta -> foco
    timer.tick(60); // foco -> pausa longa

    expect(changes).toEqual([
      { from: "focus", to: "shortBreak", completedFocusCycles: 1 },
      { from: "shortBreak", to: "focus", completedFocusCycles: 1 },
      { from: "focus", to: "longBreak", completedFocusCycles: 2 },
    ]);
  });

  it("não avisa enquanto a fase não termina, nem com o timer parado", () => {
    const timer = new PomodoroTimer({ focusMinutes: 1 });
    const listener = vi.fn();
    timer.onPhaseChange(listener);
    timer.tick(60); // parado
    timer.start();
    timer.tick(59);
    expect(listener).not.toHaveBeenCalled();
  });

  it("a função devolvida cancela a inscrição", () => {
    const timer = shortTimer();
    const listener = vi.fn();
    const off = timer.onPhaseChange(listener);
    off();
    timer.tick(60);
    expect(listener).not.toHaveBeenCalled();
  });

  it("um listener pode se cancelar durante o aviso sem afetar os outros", () => {
    const timer = shortTimer();
    const second = vi.fn();
    const off = timer.onPhaseChange(() => off());
    timer.onPhaseChange(second);
    timer.tick(60);
    timer.tick(60);
    expect(second).toHaveBeenCalledTimes(2);
  });
});
