import { beforeEach, describe, expect, it } from "vitest";
import { PomodoroTimer } from "../pomodoro.js";

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
