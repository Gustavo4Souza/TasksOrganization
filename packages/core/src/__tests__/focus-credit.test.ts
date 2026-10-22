import { describe, expect, it, vi } from "vitest";
import { creditFocusToBattle } from "../focus-credit.js";
import { PomodoroTimer } from "../pomodoro.js";
import { TaskStore } from "../task.js";

function setup() {
  const timer = new PomodoroTimer({ focusMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1, cyclesBeforeLongBreak: 4 });
  const store = new TaskStore();
  timer.start();
  return { timer, store };
}

describe("creditFocusToBattle (T1.1.4)", () => {
  it("ao fim de um Foco credita +1 na missão em batalha", () => {
    const { timer, store } = setup();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);
    creditFocusToBattle(timer, store);

    timer.tick(60);
    expect(store.get(task.id)?.pomodoros).toBe(1);
  });

  it("o fim de uma pausa não credita", () => {
    const { timer, store } = setup();
    const task = store.add({ title: "Batalha" });
    store.startBattle(task.id);
    creditFocusToBattle(timer, store);

    timer.tick(60); // foco termina: +1
    timer.tick(60); // pausa termina: nada
    expect(store.get(task.id)?.pomodoros).toBe(1);
  });

  it("credita na missão que está em batalha no momento em que o foco termina", () => {
    const { timer, store } = setup();
    const a = store.add({ title: "A" });
    const b = store.add({ title: "B" });
    store.startBattle(a.id);
    creditFocusToBattle(timer, store);

    timer.tick(30);
    store.startBattle(b.id); // trocou de missão no meio do foco
    timer.tick(30);

    expect(store.get(a.id)?.pomodoros).toBe(0);
    expect(store.get(b.id)?.pomodoros).toBe(1);
  });

  it("sem missão em batalha o foco não vai para ninguém", () => {
    const { timer, store } = setup();
    const task = store.add({ title: "Parada" });
    const onCredit = vi.fn();
    creditFocusToBattle(timer, store, onCredit);

    timer.tick(60);
    expect(store.get(task.id)?.pomodoros).toBe(0);
    expect(onCredit).not.toHaveBeenCalled();
  });

  it("entrega a tarefa atualizada para a interface salvar", () => {
    const { timer, store } = setup();
    const task = store.add({ title: "Salvar depois" });
    store.startBattle(task.id);
    const onCredit = vi.fn();
    creditFocusToBattle(timer, store, onCredit);

    timer.tick(60);
    expect(onCredit).toHaveBeenCalledWith(expect.objectContaining({ id: task.id, pomodoros: 1, status: "doing" }));
  });

  it("a função devolvida desfaz a ligação", () => {
    const { timer, store } = setup();
    const task = store.add({ title: "Desligar" });
    store.startBattle(task.id);
    const unlink = creditFocusToBattle(timer, store);
    unlink();

    timer.tick(60);
    expect(store.get(task.id)?.pomodoros).toBe(0);
  });
});
