import {
  createHttpTaskRepository,
  createLocalStorageTaskRepository,
  createOfflineTaskRepository,
  migrateTasksToRepository,
  type TaskRepository,
} from "@tasksorg/core";

export const webApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function browserFetch(url: string, init?: Parameters<typeof fetch>[1]) {
  return fetch(url, init);
}

export function createWebTaskRepository(storage: Storage, apiBaseUrl = webApiUrl): TaskRepository {
  const local = createLocalStorageTaskRepository(storage);
  if (!apiBaseUrl) return local;
  const remote = createHttpTaskRepository({ baseUrl: apiBaseUrl, fetch: browserFetch });
  return createOfflineTaskRepository({ local, remote, storage });
}

/** Envia as missões do MVP 1 para a conta logo após login/cadastro. */
export async function migrateWebTasksToAccount(storage: Storage, apiBaseUrl = webApiUrl): Promise<number> {
  if (!apiBaseUrl) return 0;
  const local = createLocalStorageTaskRepository(storage);
  const remote = createHttpTaskRepository({ baseUrl: apiBaseUrl, fetch: browserFetch });
  const count = await migrateTasksToRepository(local, remote);
  storage.setItem("tasksorg:account-migration", "1");
  return count;
}
