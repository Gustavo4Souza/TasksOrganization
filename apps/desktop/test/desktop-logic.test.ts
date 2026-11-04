import { describe, expect, it } from "vitest";
import { formatTrayTime, normalizeWindowState, resolveInitialTheme, restoreWindowBounds, type WindowState } from "../src/desktop-logic.js";

const displays = [
  { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
  { id: 2, workArea: { x: 1920, y: 0, width: 1280, height: 1024 } },
];

describe("lógica do Desktop", () => {
  it("preserva o tema salvo e usa o sistema apenas na primeira visita", () => {
    expect(resolveInitialTheme("castelo", true)).toBe("castelo");
    expect(resolveInitialTheme("pergaminho", false)).toBe("pergaminho");
    expect(resolveInitialTheme(null, true)).toBe("pergaminho");
    expect(resolveInitialTheme("inválido", false)).toBe("castelo");
  });

  it("formata o tempo exibido pela bandeja", () => {
    expect(formatTrayTime(1_500)).toBe("25:00");
    expect(formatTrayTime(65)).toBe("01:05");
  });

  it("ignora estado de janela corrompido e normaliza campos opcionais", () => {
    expect(normalizeWindowState({ width: -1, height: 800 })).toBeNull();
    expect(normalizeWindowState({ width: 900, height: 700, x: "fora", y: 20, displayId: 2.5, alwaysOnTop: true }))
      .toEqual({ width: 900, height: 700, y: 20, alwaysOnTop: true });
  });

  it("restaura e limita a janela dentro do monitor salvo", () => {
    const state: WindowState = { x: 3_100, y: 900, width: 1_200, height: 900, displayId: 2, alwaysOnTop: false };
    expect(restoreWindowBounds(state, displays, 1, 2)).toEqual({ x: 2_000, y: 124, width: 1_200, height: 900 });
  });

  it("centraliza pelo sistema quando o monitor salvo não existe mais", () => {
    const state: WindowState = { x: 4_000, y: 100, width: 1_280, height: 800, displayId: 3, alwaysOnTop: true };
    expect(restoreWindowBounds(state, displays, 1)).toEqual({ width: 1_280, height: 800 });
  });
});
