import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  getAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke("window:get-always-on-top"),
  setAlwaysOnTop: (value: boolean): Promise<boolean> => ipcRenderer.invoke("window:set-always-on-top", value),
  getWindowState: (): Promise<{ alwaysOnTop: boolean }> => ipcRenderer.invoke("window:get-state"),
  setTrayPomodoro: (snapshot: { phase: string; remainingSeconds: number }): void => ipcRenderer.send("tray:set-pomodoro", snapshot),
  readTasksFile: (): Promise<string | null> => ipcRenderer.invoke("tasks:read"),
  writeTasksFile: (text: string): Promise<void> => ipcRenderer.invoke("tasks:write", text),
  readSessionToken: (): Promise<string | null> => ipcRenderer.invoke("session:read"),
  writeSessionToken: (token: string): Promise<void> => ipcRenderer.invoke("session:write", token),
  clearSessionToken: (): Promise<void> => ipcRenderer.invoke("session:clear"),
  apiRequest: (request: { path: string; method?: string; body?: string; token?: string }): Promise<{ ok: boolean; status: number; body: string }> => ipcRenderer.invoke("api:request", request),
});
