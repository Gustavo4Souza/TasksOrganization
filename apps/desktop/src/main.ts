import { app, BrowserWindow, ipcMain, Menu, nativeImage, safeStorage, screen, Tray } from "electron";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import { formatTrayTime, normalizeWindowState, restoreWindowBounds, type WindowState } from "./desktop-logic.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let windowState: WindowState = { width: 1280, height: 800, alwaysOnTop: false };

function statePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

function tasksPath(): string {
  return path.join(app.getPath("userData"), "tasks.json");
}

function sessionPath(): string {
  return path.join(app.getPath("userData"), "session.bin");
}

async function readSessionToken(): Promise<string | null> {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(await fsPromises.readFile(sessionPath()));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeSessionToken(token: unknown): Promise<void> {
  if (typeof token !== "string" || token.length < 20 || token.length > 512) throw new Error("Sessão inválida.");
  if (!safeStorage.isEncryptionAvailable()) throw new Error("Armazenamento seguro indisponível.");
  await fsPromises.mkdir(app.getPath("userData"), { recursive: true });
  await fsPromises.writeFile(sessionPath(), safeStorage.encryptString(token));
}

async function clearSessionToken(): Promise<void> {
  try { await fsPromises.unlink(sessionPath()); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

const API_PATH = /^\/(?:auth\/(?:login|register|logout)|tasks(?:\/[A-Za-z0-9_-]{1,100})?|kpis(?:\?.*)?)$/;
const API_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

async function apiRequest(input: unknown): Promise<{ ok: boolean; status: number; body: string }> {
  const value = input as { path?: unknown; method?: unknown; body?: unknown; token?: unknown };
  const requestPath = typeof value?.path === "string" ? value.path : "";
  const method = typeof value?.method === "string" ? value.method.toUpperCase() : "GET";
  if (!API_PATH.test(requestPath) || !API_METHODS.has(method)) throw new Error("Requisição da API não permitida.");
  if (value.body !== undefined && typeof value.body !== "string") throw new Error("Corpo da requisição inválido.");
  const token = typeof value.token === "string" ? value.token : undefined;
  const baseUrl = (process.env.TASKSORG_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${requestPath}`, {
    method,
    headers: {
      accept: "application/json",
      ...(value.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof value.body === "string" ? value.body : undefined,
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}

async function readTasksFile(): Promise<string | null> {
  try {
    return await fsPromises.readFile(tasksPath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeTasksFile(text: unknown): Promise<void> {
  if (typeof text !== "string" || text.length > 10_000_000) throw new Error("Arquivo de missões inválido.");
  const parsed = JSON.parse(text) as { version?: unknown; tasks?: unknown };
  if (parsed?.version !== 1 || !Array.isArray(parsed.tasks)) throw new Error("Formato do arquivo de missões inválido.");
  await fsPromises.mkdir(app.getPath("userData"), { recursive: true });
  await fsPromises.writeFile(tasksPath(), text, "utf8");
}

async function loadWindowState(): Promise<void> {
  try {
    const saved = normalizeWindowState(JSON.parse(await fsPromises.readFile(statePath(), "utf8")));
    if (saved) windowState = saved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Could not load window state.", error);
  }
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  windowState = {
    ...windowState,
    ...bounds,
    displayId: screen.getDisplayMatching(bounds).id,
    alwaysOnTop: mainWindow.isAlwaysOnTop(),
  };
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(windowState, null, 2), "utf8");
}

function restoredBounds(): { x?: number; y?: number; width: number; height: number } {
  const displays = screen.getAllDisplays().map(({ id, workArea }) => ({ id, workArea }));
  const primaryDisplayId = screen.getPrimaryDisplay().id;
  const nearestDisplayId = windowState.x === undefined || windowState.y === undefined
    ? undefined
    : screen.getDisplayNearestPoint({ x: windowState.x, y: windowState.y }).id;
  return restoreWindowBounds(windowState, displays, primaryDisplayId, nearestDisplayId);
}

function trayIconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "tasksorg-icon.png")
    : path.join(__dirname, "..", "..", "mobile", "assets", "icon.png");
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    ...restoredBounds(),
    title: "TasksOrg — Desktop",
    minWidth: 720,
    minHeight: 560,
    alwaysOnTop: windowState.alwaysOnTop,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);
  mainWindow.on("close", (event) => {
    saveWindowState();
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const source = nativeImage.createFromPath(trayIconPath());
  tray = new Tray(source.isEmpty() ? nativeImage.createEmpty() : source.resize({ width: 16, height: 16 }));
  tray.setToolTip("TasksOrg · Foco 25:00");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Abrir TasksOrg", click: () => {
      if (!mainWindow || mainWindow.isDestroyed()) createWindow();
      mainWindow?.show();
      mainWindow?.focus();
    } },
    { label: "Sempre no topo", type: "checkbox", checked: windowState.alwaysOnTop, click: (item) => {
      windowState.alwaysOnTop = item.checked;
      mainWindow?.setAlwaysOnTop(item.checked);
      saveWindowState();
    } },
    { type: "separator" },
    { label: "Sair", click: () => {
      isQuitting = true;
      app.quit();
    } },
  ]));
}

app.whenReady().then(async () => {
  await loadWindowState();
  ipcMain.handle("window:get-state", () => ({ alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? windowState.alwaysOnTop }));
  ipcMain.handle("window:get-always-on-top", () => mainWindow?.isAlwaysOnTop() ?? windowState.alwaysOnTop);
  ipcMain.handle("window:set-always-on-top", (_event, value: unknown) => {
    const next = value === true;
    windowState.alwaysOnTop = next;
    mainWindow?.setAlwaysOnTop(next);
    saveWindowState();
    return next;
  });
  ipcMain.handle("tasks:read", readTasksFile);
  ipcMain.handle("tasks:write", (_event, text: unknown) => writeTasksFile(text));
  ipcMain.handle("session:read", readSessionToken);
  ipcMain.handle("session:write", (_event, token: unknown) => writeSessionToken(token));
  ipcMain.handle("session:clear", clearSessionToken);
  ipcMain.handle("api:request", (_event, input: unknown) => apiRequest(input));
  ipcMain.on("tray:set-pomodoro", (_event, value: unknown) => {
    if (typeof value !== "object" || value === null) return;
    const { phase, remainingSeconds } = value as { phase?: unknown; remainingSeconds?: unknown };
    if (!(["focus", "shortBreak", "longBreak"] as unknown[]).includes(phase)) return;
    if (typeof remainingSeconds !== "number" || !Number.isFinite(remainingSeconds) || remainingSeconds < 0) return;
    const label = phase === "focus" ? "Foco" : phase === "shortBreak" ? "Pausa curta" : "Pausa longa";
    tray?.setToolTip(`TasksOrg · ${label} ${formatTrayTime(remainingSeconds)}`);
  });
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  saveWindowState();
  tray?.destroy();
});
