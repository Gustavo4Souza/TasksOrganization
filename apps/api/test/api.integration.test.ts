import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { createDatabasePool, migrate, type DatabasePool } from "../src/database.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration("API com PostgreSQL real", () => {
  let pool: DatabasePool;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    pool = createDatabasePool(databaseUrl!);
    await migrate(pool);
    await pool.query("TRUNCATE incidents, deployments, pipeline_runs, daily_progress, pomodoro_sessions, tasks, sessions, users CASCADE");
    app = await buildApp(pool, {
      databaseUrl: databaseUrl!, host: "127.0.0.1", port: 3001,
      allowedOrigins: ["http://localhost:3000"], sessionDays: 30, secureCookies: false,
      kpiIngestSecret: "segredo-de-coleta", trustProxy: false,
    });
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  async function register(email: string) {
    const response = await app.inject({ method: "POST", url: "/auth/register", payload: { name: "Aventureiro", email, password: "senha-segura" } });
    expect(response.statusCode).toBe(201);
    return response.json<{ token: string }>().token;
  }

  it("expõe health e ready", async () => {
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.headers["x-ratelimit-limit"]).toBe("120");
    expect((await app.inject({ method: "GET", url: "/ready" })).statusCode).toBe(200);
  });

  it("limita tentativas repetidas de autenticação", async () => {
    const isolatedApp = await buildApp(pool, {
      databaseUrl: databaseUrl!, host: "127.0.0.1", port: 3001,
      allowedOrigins: ["http://localhost:3000"], sessionDays: 30, secureCookies: false,
      kpiIngestSecret: "segredo-de-coleta", trustProxy: false,
    });
    try {
      const attempt = () => isolatedApp.inject({ method: "POST", url: "/auth/login", payload: {} });
      for (let index = 0; index < 10; index += 1) expect((await attempt()).statusCode).toBe(400);
      const blocked = await attempt();
      expect(blocked.statusCode).toBe(429);
      expect(blocked.headers["retry-after"]).toBeDefined();
    } finally {
      await isolatedApp.close();
    }
  });

  it("registra, autentica e isola as missões por usuário", async () => {
    const tokenA = await register("a@example.test");
    const tokenB = await register("b@example.test");
    const created = await app.inject({
      method: "POST", url: "/tasks", headers: { authorization: `Bearer ${tokenA}` },
      payload: { title: "Missão A", scope: "daily", status: "todo", priority: "high" },
    });
    expect(created.statusCode).toBe(201);
    expect((await app.inject({ method: "GET", url: "/tasks", headers: { authorization: `Bearer ${tokenA}` } })).json<{ tasks: unknown[] }>().tasks).toHaveLength(1);
    expect((await app.inject({ method: "GET", url: "/tasks", headers: { authorization: `Bearer ${tokenB}` } })).json<{ tasks: unknown[] }>().tasks).toHaveLength(0);
    const foreignUpdate = await app.inject({ method: "PUT", url: `/tasks/${created.json<{ task: { id: string } }>().task.id}`, headers: { authorization: `Bearer ${tokenB}` }, payload: created.json<{ task: unknown }>().task });
    expect(foreignUpdate.statusCode).toBe(404);

    const login = await app.inject({ method: "POST", url: "/auth/login", payload: { email: "a@example.test", password: "senha-segura" } });
    expect(login.statusCode).toBe(200);
    expect(login.headers["set-cookie"]).toContain("HttpOnly");
  });

  it("mantém somente uma missão em batalha e registra foco/progresso", async () => {
    const token = await register("progress@example.test");
    const auth = { authorization: `Bearer ${token}` };
    const create = async (title: string) => (await app.inject({ method: "POST", url: "/tasks", headers: auth, payload: { title, scope: "daily", status: "todo", priority: "medium" } })).json<{ task: Record<string, unknown> }>().task;
    const first = await create("Primeira");
    const second = await create("Segunda");
    const put = (task: Record<string, unknown>) => app.inject({ method: "PUT", url: `/tasks/${task.id}`, headers: auth, payload: task });
    await put({ ...first, status: "doing", updatedAt: new Date().toISOString() });
    await put({ ...second, status: "doing", updatedAt: new Date().toISOString() });
    const tasks = (await app.inject({ method: "GET", url: "/tasks", headers: auth })).json<{ tasks: Array<{ id: string; status: string; pomodoros: number }> }>().tasks;
    expect(tasks.filter((task) => task.status === "doing")).toEqual([expect.objectContaining({ id: second.id })]);

    const now = new Date();
    const session = await app.inject({ method: "POST", url: "/pomodoro-sessions", headers: auth, payload: {
      taskId: second.id, phase: "focus", durationSeconds: 1500,
      startedAt: new Date(now.getTime() - 1_500_000).toISOString(), completedAt: now.toISOString(),
    } });
    expect(session.statusCode).toBe(201);
    const progress = (await app.inject({ method: "GET", url: "/progress", headers: auth })).json<{ days: Array<{ focus_count: number; level: number }> }>();
    expect(progress.days[0]).toMatchObject({ focus_count: 1, level: 1 });
  });

  it("ignora alteração mais antiga que a do servidor (last write wins)", async () => {
    const token = await register("lww@example.test");
    const auth = { authorization: `Bearer ${token}` };
    const task = (await app.inject({ method: "POST", url: "/tasks", headers: auth, payload: { title: "Original" } })).json<{ task: Record<string, unknown> }>().task;
    const newer = new Date(Date.now() + 60_000).toISOString();
    const older = new Date(Date.now() - 60_000).toISOString();

    const recent = await app.inject({ method: "PUT", url: `/tasks/${task.id}`, headers: auth, payload: { ...task, title: "Recente", updatedAt: newer } });
    expect(recent.json<{ task: { title: string } }>().task.title).toBe("Recente");

    const stale = await app.inject({ method: "PUT", url: `/tasks/${task.id}`, headers: auth, payload: { ...task, title: "Antiga", status: "done", completedAt: older, updatedAt: older } });
    expect(stale.statusCode).toBe(200);
    expect(stale.json<{ task: { title: string; status: string } }>().task).toMatchObject({ title: "Recente", status: "todo" });
    const progress = (await app.inject({ method: "GET", url: "/progress", headers: auth })).json<{ days: unknown[] }>();
    expect(progress.days).toHaveLength(0);
  });

  it("login com e-mail inexistente responde 401 sem revelar a conta", async () => {
    const response = await app.inject({ method: "POST", url: "/auth/login", payload: { email: "ninguem@example.test", password: "senha-segura" } });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "E-mail ou senha inválidos." });
  });

  it("usa o IP real do cliente atrás de um proxy confiável", async () => {
    const proxied = await buildApp(pool, {
      databaseUrl: databaseUrl!, host: "127.0.0.1", port: 3001,
      allowedOrigins: ["http://localhost:3000"], sessionDays: 30, secureCookies: false, trustProxy: 1,
    });
    try {
      const attempt = (ip: string) => proxied.inject({ method: "POST", url: "/auth/login", headers: { "x-forwarded-for": ip }, payload: {} });
      for (let index = 0; index < 10; index += 1) expect((await attempt("203.0.113.1")).statusCode).toBe(400);
      expect((await attempt("203.0.113.1")).statusCode).toBe(429);
      expect((await attempt("203.0.113.2")).statusCode).toBe(400);
    } finally {
      await proxied.close();
    }
  });

  it("rejeita mutação de origem não permitida", async () => {
    const response = await app.inject({ method: "POST", url: "/auth/login", headers: { origin: "https://evil.example" }, payload: { email: "x@y.test", password: "senha-segura" } });
    expect(response.statusCode).toBe(403);
  });

  it("libera preflight das operações de sincronização para a origem Web", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/tasks/id",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "PUT",
        "access-control-request-headers": "content-type",
      },
    });
    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("PUT");
    expect(response.headers["access-control-allow-methods"]).toContain("DELETE");
  });

  it("registra eventos reais e calcula os quatro KPIs do dashboard", async () => {
    const token = await register("kpis@example.test");
    const ingest = { "x-kpi-secret": "segredo-de-coleta" };
    const now = new Date();
    const started = new Date(now.getTime() - 600_000);
    const deploy = await app.inject({ method: "POST", url: "/internal/kpis/deployments", headers: ingest, payload: {
      environment: "production", version: "sha-1234567", commitSha: "1234567abcdef",
      status: "success", workflowRunId: "run-deploy-1", startedAt: started.toISOString(), completedAt: now.toISOString(),
    } });
    expect(deploy.statusCode).toBe(201);
    await app.inject({ method: "POST", url: "/internal/kpis/pipelines", headers: ingest, payload: {
      workflowRunId: "run-ci-1", commitSha: "1234567abcdef", branch: "main", status: "success",
      startedAt: started.toISOString(), completedAt: now.toISOString(), firstCommitAt: new Date(started.getTime() - 600_000).toISOString(), testsTotal: 100, testsPassed: 98,
      coveragePercentage: 98.9, flakyTests: 0,
    } });
    await app.inject({ method: "POST", url: "/internal/kpis/incidents", headers: ingest, payload: {
      deploymentId: deploy.json<{ id: string }>().id, title: "Falha recuperada", severity: "medium", status: "resolved",
      detectedAt: new Date(now.getTime() - 300_000).toISOString(), resolvedAt: now.toISOString(), escapedDefect: true,
    } });
    const storedPipeline = await pool.query<{ first_commit_at: Date }>("SELECT first_commit_at FROM pipeline_runs WHERE workflow_run_id = 'run-ci-1'");
    const storedIncident = await pool.query<{ escaped_defect: boolean }>("SELECT escaped_defect FROM incidents WHERE title = 'Falha recuperada'");
    expect(storedPipeline.rows[0]?.first_commit_at).toBeInstanceOf(Date);
    expect(storedIncident.rows[0]?.escaped_defect).toBe(true);

    const response = await app.inject({ method: "GET", url: "/kpis?period=7d", headers: { authorization: `Bearer ${token}` } });
    expect(response.statusCode).toBe(200);
    const metrics = response.json<{ metrics: Array<{ metric_id: string; value: number }> }>().metrics;
    expect(metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric_id: "deployment_frequency", value: 1 }),
      expect.objectContaining({ metric_id: "change_failure_rate", value: 0 }),
      expect.objectContaining({ metric_id: "mttr", value: 5 }),
      expect.objectContaining({ metric_id: "test_success_rate", value: 98 }),
    ]));
  });
});
