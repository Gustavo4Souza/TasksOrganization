import {
  createJsonFileTaskRepository,
  createLocalStorageTaskRepository,
  type KeyValueStorage,
  type Task,
  type TaskRepository,
} from "@tasksorg/core";

export const LEGACY_DESKTOP_TASKS_KEY = "tasksorg:desktop:tasks";

export interface DesktopTaskBridge {
  readTasksFile(): Promise<string | null>;
  writeTasksFile(text: string): Promise<void>;
}

interface LegacyStorage extends KeyValueStorage {
  removeItem(key: string): void;
}

export function createDesktopTaskRepository(bridge: DesktopTaskBridge): TaskRepository {
  return createJsonFileTaskRepository({
    async readFile() {
      const text = await bridge.readTasksFile();
      if (text !== null) return text;
      const error = new Error("Arquivo de missões ainda não existe.") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    },
    async writeFile(_path, text) {
      await bridge.writeTasksFile(text);
    },
  }, "tasks.json");
}

/** Move uma única vez as missões salvas pelo renderer antigo para o arquivo JSON. */
export async function loadDesktopTasks(repository: TaskRepository, legacyStorage?: LegacyStorage): Promise<Task[]> {
  const fileTasks = await repository.list();
  if (fileTasks.length > 0 || !legacyStorage?.getItem(LEGACY_DESKTOP_TASKS_KEY)) return fileTasks;

  const legacyRepository = createLocalStorageTaskRepository(legacyStorage, LEGACY_DESKTOP_TASKS_KEY);
  const legacyTasks = await legacyRepository.list();
  for (const task of legacyTasks) await repository.save(task);
  legacyStorage.removeItem(LEGACY_DESKTOP_TASKS_KEY);
  return legacyTasks;
}
