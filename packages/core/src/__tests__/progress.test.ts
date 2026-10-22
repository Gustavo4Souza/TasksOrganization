import { describe, expect, it } from "vitest";
import { completionsByDay, dayLevel, monthLevel, toDayKey, weekProgress, yearProgress } from "../progress.js";
import { type Task, createTask } from "../task.js";

/** Tarefa concluída num horário LOCAL — o teste vale em qualquer fuso. */
function doneAt(year: number, month: number, day: number, hour = 12): Task {
  return { ...createTask({ title: "x" }), status: "done", completedAt: new Date(year, month - 1, day, hour).toISOString() };
}

// Sexta-feira, 2 de outubro de 2026, 15h (horário local).
const today = new Date(2026, 9, 2, 15);

describe("completionsByDay", () => {
  it("conta conclusões por dia no fuso local, inclusive perto da meia-noite", () => {
    const counts = completionsByDay([doneAt(2026, 10, 1, 23), doneAt(2026, 10, 1, 0), doneAt(2026, 10, 2, 9)]);
    expect(counts.get("2026-10-01")).toBe(2);
    expect(counts.get("2026-10-02")).toBe(1);
  });

  it("ignora tarefas não concluídas e datas inválidas", () => {
    const open: Task = { ...createTask({ title: "aberta" }), completedAt: new Date().toISOString() };
    const broken: Task = { ...createTask({ title: "quebrada" }), status: "done", completedAt: "ontem" };
    expect(completionsByDay([open, broken]).size).toBe(0);
  });
});

describe("níveis", () => {
  it("dia: 0 conclusões = 0, 1–2 = 1, 3–4 = 2, 5+ = 3", () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((n) => dayLevel(n))).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });

  it("dia: limites configuráveis", () => {
    expect(dayLevel(2, [1, 2, 3])).toBe(2);
  });

  it("mês: proporção de dias ativos entre os que já passaram", () => {
    expect(monthLevel(0, 30)).toBe(0);
    expect(monthLevel(5, 30)).toBe(1);
    expect(monthLevel(10, 30)).toBe(2);
    expect(monthLevel(20, 30)).toBe(3);
    expect(monthLevel(0, 0)).toBe(0);
  });
});

describe("weekProgress (T1.1.5)", () => {
  it("devolve segunda a domingo da semana de hoje", () => {
    const week = weekProgress([], today);
    expect(week.map((d) => d.date)).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    ]);
  });

  it("marca hoje, os dias futuros e o nível de cada dia", () => {
    const tasks = [doneAt(2026, 9, 28), doneAt(2026, 9, 30), doneAt(2026, 9, 30), doneAt(2026, 9, 30), ...Array.from({ length: 5 }, () => doneAt(2026, 10, 2))];
    const week = weekProgress(tasks, today);
    expect(week.map((d) => d.level)).toEqual([1, 0, 2, 0, 3, 0, 0]);
    expect(week.find((d) => d.isToday)?.date).toBe("2026-10-02");
    expect(week.filter((d) => d.isFuture).map((d) => d.date)).toEqual(["2026-10-03", "2026-10-04"]);
  });

  it("domingo pertence à semana que começou na segunda anterior", () => {
    const sunday = new Date(2026, 9, 4, 10);
    expect(weekProgress([], sunday)[0]!.date).toBe("2026-09-28");
  });
});

describe("yearProgress (T1.1.5)", () => {
  it("devolve os 12 meses com o mês atual marcado", () => {
    const year = yearProgress([], 2026, today);
    expect(year).toHaveLength(12);
    expect(year.map((m) => m.month)[0]).toBe("2026-01");
    expect(year.find((m) => m.isCurrent)?.month).toBe("2026-10");
  });

  it("no mês atual só conta os dias que já passaram; meses futuros ficam zerados", () => {
    const year = yearProgress([doneAt(2026, 10, 1), doneAt(2026, 10, 2)], 2026, today);
    const october = year[9]!;
    expect(october).toMatchObject({ completed: 2, activeDays: 2, elapsedDays: 2, level: 3 });
    expect(year[10]).toMatchObject({ elapsedDays: 0, level: 0 });
  });

  it("calcula o nível do mês pela proporção de dias ativos", () => {
    // Setembro (30 dias): 12 dias ativos = 40% → nível 2
    const tasks = Array.from({ length: 12 }, (_, i) => doneAt(2026, 9, i + 1));
    expect(yearProgress(tasks, 2026, today)[8]).toMatchObject({ activeDays: 12, elapsedDays: 30, level: 2 });
  });

  it("considera anos bissextos", () => {
    expect(yearProgress([], 2028, new Date(2028, 11, 31))[1]!.elapsedDays).toBe(29);
  });
});

describe("toDayKey", () => {
  it("usa a data local com zeros à esquerda", () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
