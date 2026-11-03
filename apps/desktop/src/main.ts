import { app, BrowserWindow, ipcMain, Menu, nativeImage, screen, Tray } from "electron";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";

type WindowState = { x?: number; y?: number; width: number; height: number; displayId?: number; alwaysOnTop: boolean };
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let windowState: WindowState = { width: 1280, height: 800, alwaysOnTop: false };

function statePath(): string {
  return path.join(app.getPath("userData"), "window-state.json");
}

async function loadWindowState(): Promise<void> {
  try {
    const saved = JSON.parse(await fsPromises.readFile(statePath(), "utf8")) as Partial<WindowState>;
    if (typeof saved.width === "number" && typeof saved.height === "number") {
      windowState = { ...windowState, ...saved };
    }
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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
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
  mainWindow.on("close", saveWindowState);
}

function createTray(): void {
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("TasksOrg");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Abrir TasksOrg", click: () => mainWindow?.show() },
    { label: "Sempre no topo", type: "checkbox", checked: windowState.alwaysOnTop, click: (item) => {
      windowState.alwaysOnTop = item.checked;
      mainWindow?.setAlwaysOnTop(item.checked);
      saveWindowState();
    } },
    { type: "separator" },
    { label: "Sair", click: () => app.quit() },
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
  saveWindowState();
  tray?.destroy();
});
