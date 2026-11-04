// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStorageTaskRepository, createTask } from "@tasksorg/core";
import { createWebTaskRepository, migrateWebTasksToAccount } from "../app/task-repository";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("repositório Web sincronizado", () => {
  it("continua salvando localmente quando a API cai", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const repository = createWebTaskRepository(window.localStorage, "https://api.example.test");
    const task = createTask({ title: "Continuar offline" });
    await repository.save(task);
    expect(await createLocalStorageTaskRepository(window.localStorage).list()).toEqual([task]);
    expect(JSON.parse(window.localStorage.getItem("tasksorg:sync-queue")!)).toHaveLength(1);
  });

  it("migra as missões locais depois do login", async () => {
    const task = createTask({ title: "Missão antiga" });
    await createLocalStorageTaskRepository(window.localStorage).save(task);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(migrateWebTasksToAccount(window.localStorage, "https://api.example.test")).resolves.toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(`https://api.example.test/tasks/${task.id}`, expect.objectContaining({ method: "PUT", credentials: "include" }));
    expect(window.localStorage.getItem("tasksorg:account-migration")).toBe("1");
  });
});
