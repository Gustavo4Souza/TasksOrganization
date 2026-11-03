import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  getAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke("window:get-always-on-top"),
  setAlwaysOnTop: (value: boolean): Promise<boolean> => ipcRenderer.invoke("window:set-always-on-top", value),
  getWindowState: (): Promise<{ alwaysOnTop: boolean }> => ipcRenderer.invoke("window:get-state"),
});
