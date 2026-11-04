import { createTask, parseStoredTasks, serializeTasks } from "@tasksorg/core";
import { describe, expect, it, vi } from "vitest";
import {
  createDesktopTaskRepository,
  LEGACY_DESKTOP_TASKS_KEY,
  loadDesktopTasks,
  type DesktopTaskBridge,
} from "../src/desktop-repository.js";

function bridgeWith(initial: string | null = null): DesktopTaskBridge & { text: string | null } {
  return {
    text: initial,
    async readTasksFile() { return this.text; },
    async writeTasksFile(text) { this.text = text; },
  };
}

describe("persistência JSON do Desktop", () => {
  it("salva e lê missões pelo arquivo exposto no preload", async () => {
    const bridge = bridgeWith();
    const repository = createDesktopTaskRepository(bridge);
    const task = createTask({ title: "Persistir no Desktop" });

    await repository.save(task);

    expect(parseStoredTasks(bridge.text!)).toEqual([task]);
    expect(await createDesktopTaskRepository(bridge).list()).toEqual([task]);
  });

  it("migra o localStorage antigo uma vez e o remove após gravar o JSON", async () => {
    const task = createTask({ title: "Missão antiga" });
    const bridge = bridgeWith();
    const repository = createDesktopTaskRepository(bridge);
    const removeItem = vi.fn();
    const storage = {
      getItem: (key: string) => key === LEGACY_DESKTOP_TASKS_KEY ? serializeTasks([task]) : null,
      setItem: vi.fn(),
      removeItem,
    };

    expect(await loadDesktopTasks(repository, storage)).toEqual([task]);
    expect(parseStoredTasks(bridge.text!)).toEqual([task]);
    expect(removeItem).toHaveBeenCalledWith(LEGACY_DESKTOP_TASKS_KEY);
  });
});
