export type ThemeName = "castelo" | "pergaminho";

export type WindowState = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  displayId?: number;
  alwaysOnTop: boolean;
};

export type DisplayBounds = {
  id: number;
  workArea: { x: number; y: number; width: number; height: number };
};

export function resolveInitialTheme(saved: unknown, prefersLight: boolean): ThemeName {
  if (saved === "castelo" || saved === "pergaminho") return saved;
  return prefersLight ? "pergaminho" : "castelo";
}

export function formatTrayTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function normalizeWindowState(input: unknown): WindowState | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.width !== "number" || !Number.isFinite(raw.width) || raw.width <= 0) return null;
  if (typeof raw.height !== "number" || !Number.isFinite(raw.height) || raw.height <= 0) return null;

  const state: WindowState = {
    width: raw.width,
    height: raw.height,
    alwaysOnTop: raw.alwaysOnTop === true,
  };
  if (typeof raw.x === "number" && Number.isFinite(raw.x)) state.x = raw.x;
  if (typeof raw.y === "number" && Number.isFinite(raw.y)) state.y = raw.y;
  if (typeof raw.displayId === "number" && Number.isInteger(raw.displayId)) state.displayId = raw.displayId;
  return state;
}

export function restoreWindowBounds(
  state: WindowState,
  displays: DisplayBounds[],
  primaryDisplayId: number,
  nearestDisplayId?: number,
): { x?: number; y?: number; width: number; height: number } {
  const primary = displays.find((display) => display.id === primaryDisplayId) ?? displays[0];
  if (!primary) return { width: Math.max(720, state.width), height: Math.max(560, state.height) };

  const savedDisplay = state.displayId === undefined
    ? undefined
    : displays.find((display) => display.id === state.displayId);
  const nearest = nearestDisplayId === undefined
    ? undefined
    : displays.find((display) => display.id === nearestDisplayId);
  const target = savedDisplay ?? (state.displayId === undefined ? nearest ?? primary : primary);
  const area = target.workArea;
  const width = Math.min(Math.max(state.width, Math.min(720, area.width)), area.width);
  const height = Math.min(Math.max(state.height, Math.min(560, area.height)), area.height);

  if (state.x === undefined || state.y === undefined || (state.displayId !== undefined && !savedDisplay)) {
    return { width, height };
  }

  return {
    x: Math.min(Math.max(state.x, area.x), area.x + area.width - width),
    y: Math.min(Math.max(state.y, area.y), area.y + area.height - height),
    width,
    height,
  };
}
