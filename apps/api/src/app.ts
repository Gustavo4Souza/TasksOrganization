import { randomUUID } from "node:crypto";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import type { Task } from "@tasksorg/core";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import type { ApiConfig } from "./config.js";
import type { DatabaseClient, DatabasePool } from "./database.js";
import { createSessionToken, hashPassword, hashToken, verifyPassword } from "./security.js";

const SESSION_COOKIE = "tasksorg_session";
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8).max(128);
const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: emailSchema, password: passwordSchema });
const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
const taskSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(5_000).optional(),
  scope: z.enum(["daily", "weekly", "yearly"]),
  status: z.enum(["todo", "doing", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.iso.date().optional(),
  pomodoros: z.number().int().min(0),
  completedAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const createTaskSchema = taskSchema.omit({ id: true, pomodoros: true, completedAt: true, createdAt: true, updatedAt: true }).partial({ description: true, dueDate: true }).extend({
  scope: taskSchema.shape.scope.default("daily"),
  status: taskSchema.shape.status.default("todo"),
  priority: taskSchema.shape.priority.default("medium"),
});
const pomodoroSchema = z.object({
  taskId: z.string().min(1).max(80).optional(),
  phase: z.enum(["focus", "shortBreak", "longBreak"]),
  durationSeconds: z.number().int().positive().max(86_400),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});
const deploymentSchema = z.object({
  environment: z.string().trim().min(1).max(40),
  version: z.string().trim().min(1).max(120),
  commitSha: z.string().trim().min(7).max(64),
  status: z.enum(["success", "failure", "rollback", "hotfix"]),
  workflowRunId: z.string().max(80).optional(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});
const incidentSchema = z.object({
  id: z.uuid().optional(),
  deploymentId: z.uuid().optional(),
  title: z.string().trim().min(1).max(200),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "resolved"]),
  detectedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().optional(),
  notes: z.string().max(10_000).optional(),
  escapedDefect: z.boolean().default(true),
}).superRefine((value, context) => {
  if ((value.status === "resolved") !== Boolean(value.resolvedAt)) context.addIssue({ code: "custom", message: "Incidente resolvido exige resolvedAt; incidente aberto não aceita resolvedAt.", path: ["resolvedAt"] });
});
const pipelineSchema = z.object({
  workflowRunId: z.string().trim().min(1).max(80),
  commitSha: z.string().trim().min(7).max(64),
  branch: z.string().trim().min(1).max(200),
  status: z.enum(["success", "failure", "cancelled"]),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  firstCommitAt: z.iso.datetime().optional(),
  testsTotal: z.number().int().min(0).optional(),
  testsPassed: z.number().int().min(0).optional(),
  coveragePercentage: z.number().min(0).max(100).optional(),
  flakyTests: z.number().int().min(0).optional(),
});

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  scope: Task["scope"];
  status: Task["status"];
  priority: Task["priority"];
  due_date: string | Date | null;
  pomodoros: number;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOnly(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    scope: row.scope,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ? dateOnly(row.due_date) : undefined,
    pomodoros: row.pomodoros,
    completedAt: row.completed_at?.toISOString(),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function sendValidation(reply: FastifyReply, error: z.ZodError): FastifyReply {
  return reply.code(400).send({ error: "Dados inválidos.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) });
}

async function sessionUserId(request: FastifyRequest, pool: DatabasePool): Promise<string | null> {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.cookies[SESSION_COOKIE];
  if (!token) return null;
  const result = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > now()",
    [hashToken(token)],
  );
  return result.rows[0]?.user_id ?? null;
}

async function requireUser(request: FastifyRequest, reply: FastifyReply, pool: DatabasePool): Promise<string | null> {
  const userId = await sessionUserId(request, pool);
  if (!userId) reply.code(401).send({ error: "Autenticação necessária." });
  return userId;
}

async function updateCompletedProgress(client: DatabaseClient, userId: string, previous: TaskRow | undefined, task: Task): Promise<void> {
  const previousDate = previous?.status === "done" && previous.completed_at ? previous.completed_at.toISOString().slice(0, 10) : undefined;
  const nextDate = task.status === "done" && task.completedAt ? task.completedAt.slice(0, 10) : undefined;
  if (previousDate === nextDate) return;
  if (previousDate) {
    await client.query(
      `UPDATE daily_progress SET completed_count = GREATEST(0, completed_count - 1), updated_at = now()
       WHERE user_id = $1 AND progress_date = $2`,
      [userId, previousDate],
    );
  }
  if (nextDate) {
    await client.query(
      `INSERT INTO daily_progress(user_id, progress_date, completed_count) VALUES ($1, $2, 1)
       ON CONFLICT (user_id, progress_date) DO UPDATE
       SET completed_count = daily_progress.completed_count + 1, updated_at = now()`,
      [userId, nextDate],
    );
  }
}

async function saveTask(pool: DatabasePool, userId: string, task: Task): Promise<Task> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const previous = await client.query<TaskRow>("SELECT * FROM tasks WHERE id = $1 AND user_id = $2 FOR UPDATE", [task.id, userId]);
    if (task.status === "doing") {
      await client.query("UPDATE tasks SET status = 'todo', completed_at = NULL, updated_at = now() WHERE user_id = $1 AND status = 'doing' AND id <> $2", [userId, task.id]);
    }
    await updateCompletedProgress(client, userId, previous.rows[0], task);
    const result = await client.query<TaskRow>(
      `INSERT INTO tasks(id, user_id, title, description, scope, status, priority, due_date, pomodoros, completed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description, scope = EXCLUDED.scope,
         status = EXCLUDED.status, priority = EXCLUDED.priority, due_date = EXCLUDED.due_date,
         pomodoros = EXCLUDED.pomodoros, completed_at = EXCLUDED.completed_at,
         updated_at = EXCLUDED.updated_at
       WHERE tasks.user_id = EXCLUDED.user_id
       RETURNING *`,
      [task.id, userId, task.title, task.description ?? null, task.scope, task.status, task.priority, task.dueDate ?? null, task.pomodoros, task.completedAt ?? null, task.createdAt, task.updatedAt],
    );
    if (!result.rows[0]) throw new Error("Missão pertence a outro usuário.");
    await client.query("COMMIT");
    return taskFromRow(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function buildApp(pool: DatabasePool, config: ApiConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, bodyLimit: 1_000_000 });
  await app.register(cookie);
  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  app.addHook("onRequest", async (request, reply) => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
    const origin = request.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return reply.code(403).send({ error: "Origem não permitida." });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_request, reply) => {
    try {
      await pool.query("SELECT 1");
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "unavailable" });
    }
  });

  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const userId = randomUUID();
    try {
      await pool.query("INSERT INTO users(id, name, email, password_hash) VALUES ($1,$2,$3,$4)", [userId, parsed.data.name, parsed.data.email, await hashPassword(parsed.data.password)]);
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return reply.code(409).send({ error: "E-mail já cadastrado." });
      throw error;
    }
    const session = createSessionToken();
    const expiresAt = new Date(Date.now() + config.sessionDays * 86_400_000);
    await pool.query("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1,$2,$3)", [session.hash, userId, expiresAt]);
    reply.setCookie(SESSION_COOKIE, session.token, { httpOnly: true, secure: config.secureCookies, sameSite: config.secureCookies ? "none" : "lax", path: "/", expires: expiresAt });
    return reply.code(201).send({ user: { id: userId, name: parsed.data.name, email: parsed.data.email }, token: session.token });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const result = await pool.query<{ id: string; name: string; email: string; password_hash: string }>("SELECT id, name, email, password_hash FROM users WHERE email = $1", [parsed.data.email]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) return reply.code(401).send({ error: "E-mail ou senha inválidos." });
    const session = createSessionToken();
    const expiresAt = new Date(Date.now() + config.sessionDays * 86_400_000);
    await pool.query("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1,$2,$3)", [session.hash, user.id, expiresAt]);
    reply.setCookie(SESSION_COOKIE, session.token, { httpOnly: true, secure: config.secureCookies, sameSite: config.secureCookies ? "none" : "lax", path: "/", expires: expiresAt });
    return { user: { id: user.id, name: user.name, email: user.email }, token: session.token };
  });

  app.post("/auth/logout", async (request, reply) => {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : request.cookies[SESSION_COOKIE];
    if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/tasks", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const result = await pool.query<TaskRow>("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at, id", [userId]);
    return { tasks: result.rows.map(taskFromRow) };
  });

  app.post("/tasks", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const parsed = createTaskSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const now = new Date().toISOString();
    const task: Task = { id: randomUUID(), title: parsed.data.title, description: parsed.data.description, scope: parsed.data.scope, status: parsed.data.status, priority: parsed.data.priority, dueDate: parsed.data.dueDate, pomodoros: 0, completedAt: parsed.data.status === "done" ? now : undefined, createdAt: now, updatedAt: now };
    return reply.code(201).send({ task: await saveTask(pool, userId, task) });
  });

  app.put<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const parsed = taskSchema.safeParse({ ...(request.body as object), id: request.params.id });
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const conflictingOwner = await pool.query("SELECT 1 FROM tasks WHERE id = $1 AND user_id <> $2", [request.params.id, userId]);
    if (conflictingOwner.rowCount) return reply.code(404).send({ error: "Missão não encontrada." });
    return { task: await saveTask(pool, userId, parsed.data) };
  });

  app.delete<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [request.params.id, userId]);
    return result.rowCount ? reply.code(204).send() : reply.code(404).send({ error: "Missão não encontrada." });
  });

  app.post("/pomodoro-sessions", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const parsed = pomodoroSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (parsed.data.taskId) {
        const owner = await client.query("SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2", [parsed.data.taskId, userId]);
        if (!owner.rowCount) { await client.query("ROLLBACK"); return reply.code(404).send({ error: "Missão não encontrada." }); }
      }
      await client.query(
        "INSERT INTO pomodoro_sessions(id,user_id,task_id,phase,duration_seconds,started_at,completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [randomUUID(), userId, parsed.data.taskId ?? null, parsed.data.phase, parsed.data.durationSeconds, parsed.data.startedAt, parsed.data.completedAt],
      );
      if (parsed.data.phase === "focus") {
        if (parsed.data.taskId) await client.query("UPDATE tasks SET pomodoros = pomodoros + 1, updated_at = now() WHERE id = $1 AND user_id = $2", [parsed.data.taskId, userId]);
        await client.query(
          `INSERT INTO daily_progress(user_id, progress_date, focus_count) VALUES ($1, $2, 1)
           ON CONFLICT (user_id, progress_date) DO UPDATE SET focus_count = daily_progress.focus_count + 1, updated_at = now()`,
          [userId, parsed.data.completedAt.slice(0, 10)],
        );
      }
      await client.query("COMMIT");
      return reply.code(201).send({ ok: true });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

  app.get("/progress", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const query = z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }).safeParse(request.query);
    if (!query.success) return sendValidation(reply, query.error);
    const result = await pool.query(
      `SELECT progress_date, completed_count, focus_count,
              LEAST(3, completed_count + focus_count) AS level, updated_at
       FROM daily_progress
       WHERE user_id = $1 AND ($2::date IS NULL OR progress_date >= $2::date) AND ($3::date IS NULL OR progress_date <= $3::date)
       ORDER BY progress_date`,
      [userId, query.data.from ?? null, query.data.to ?? null],
    );
    return { days: result.rows };
  });

  function requireIngestSecret(request: FastifyRequest, reply: FastifyReply): boolean {
    const supplied = request.headers["x-kpi-secret"];
    if (!config.kpiIngestSecret) { reply.code(503).send({ error: "Coleta de KPIs não configurada." }); return false; }
    if (typeof supplied !== "string" || hashToken(supplied) !== hashToken(config.kpiIngestSecret)) { reply.code(401).send({ error: "Credencial de coleta inválida." }); return false; }
    return true;
  }

  app.post("/internal/kpis/deployments", async (request, reply) => {
    if (!requireIngestSecret(request, reply)) return;
    const parsed = deploymentSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const item = parsed.data;
    const result = await pool.query<{ id: string }>(
      `INSERT INTO deployments(id, environment, version, commit_sha, status, workflow_run_id, started_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (environment, version, status, completed_at) DO UPDATE SET workflow_run_id = EXCLUDED.workflow_run_id
       RETURNING id`,
      [randomUUID(), item.environment, item.version, item.commitSha, item.status, item.workflowRunId ?? null, item.startedAt, item.completedAt],
    );
    return reply.code(201).send({ id: result.rows[0]!.id });
  });

  app.post("/internal/kpis/incidents", async (request, reply) => {
    if (!requireIngestSecret(request, reply)) return;
    const parsed = incidentSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const item = parsed.data;
    const id = item.id ?? randomUUID();
    await pool.query(
      `INSERT INTO incidents(id, deployment_id, title, severity, status, detected_at, resolved_at, notes, escaped_defect)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET deployment_id=EXCLUDED.deployment_id, title=EXCLUDED.title,
         severity=EXCLUDED.severity, status=EXCLUDED.status, detected_at=EXCLUDED.detected_at,
         resolved_at=EXCLUDED.resolved_at, notes=EXCLUDED.notes, escaped_defect=EXCLUDED.escaped_defect`,
      [id, item.deploymentId ?? null, item.title, item.severity, item.status, item.detectedAt, item.resolvedAt ?? null, item.notes ?? null, item.escapedDefect],
    );
    return reply.code(201).send({ id });
  });

  app.post("/internal/kpis/pipelines", async (request, reply) => {
    if (!requireIngestSecret(request, reply)) return;
    const parsed = pipelineSchema.safeParse(request.body);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const item = parsed.data;
    await pool.query(
      `INSERT INTO pipeline_runs(workflow_run_id, commit_sha, branch, status, started_at, completed_at, first_commit_at, tests_total, tests_passed, coverage_percentage, flaky_tests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (workflow_run_id) DO UPDATE SET status=EXCLUDED.status, completed_at=EXCLUDED.completed_at,
         first_commit_at=EXCLUDED.first_commit_at,
         tests_total=EXCLUDED.tests_total, tests_passed=EXCLUDED.tests_passed,
         coverage_percentage=EXCLUDED.coverage_percentage, flaky_tests=EXCLUDED.flaky_tests`,
      [item.workflowRunId, item.commitSha, item.branch, item.status, item.startedAt, item.completedAt, item.firstCommitAt ?? null, item.testsTotal ?? null, item.testsPassed ?? null, item.coveragePercentage ?? null, item.flakyTests ?? null],
    );
    return reply.code(201).send({ id: item.workflowRunId });
  });

  app.get("/kpis", async (request, reply) => {
    const userId = await requireUser(request, reply, pool);
    if (!userId) return;
    const parsed = z.object({ period: z.enum(["7d", "30d", "90d"]).default("30d") }).safeParse(request.query);
    if (!parsed.success) return sendValidation(reply, parsed.error);
    const days = Number.parseInt(parsed.data.period, 10);
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - days * 86_400_000);
    const [deployments, incidents, tests] = await Promise.all([
      pool.query<{ total: string; successes: string; failures: string }>(
        `SELECT count(*)::text AS total,
                count(*) FILTER (WHERE status = 'success')::text AS successes,
                count(*) FILTER (WHERE status IN ('failure','rollback','hotfix'))::text AS failures
         FROM deployments WHERE completed_at >= $1 AND completed_at <= $2`, [periodStart, periodEnd]),
      pool.query<{ count: string; average_minutes: string | null }>(
        `SELECT count(*)::text AS count,
                avg(extract(epoch FROM (resolved_at - detected_at)) / 60)::text AS average_minutes
         FROM incidents WHERE status = 'resolved' AND resolved_at >= $1 AND resolved_at <= $2`, [periodStart, periodEnd]),
      pool.query<{ total: string | null; passed: string | null }>(
        `SELECT sum(tests_total)::text AS total, sum(tests_passed)::text AS passed
         FROM pipeline_runs WHERE completed_at >= $1 AND completed_at <= $2`, [periodStart, periodEnd]),
    ]);
    const deploy = deployments.rows[0]!;
    const incident = incidents.rows[0]!;
    const test = tests.rows[0]!;
    const totalDeployments = Number(deploy.total);
    const totalTests = Number(test.total ?? 0);
    const metric = (metricId: string, value: number | null, unit: "count" | "percentage" | "minutes", source: string, notes?: string) => ({
      metric_id: metricId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      value,
      unit,
      source,
      collected_at: new Date().toISOString(),
      owner: "Higor (implementação; proprietários originais no catálogo)",
      data_quality: value === null ? "unavailable" : "complete",
      notes,
    });
    return { metrics: [
      metric("deployment_frequency", totalDeployments ? Number(deploy.successes) : null, "count", "deployments", totalDeployments ? undefined : "Nenhum deploy registrado no período."),
      metric("change_failure_rate", totalDeployments ? Number(((Number(deploy.failures) / totalDeployments) * 100).toFixed(2)) : null, "percentage", "deployments", totalDeployments ? undefined : "Nenhum deploy registrado no período."),
      metric("mttr", Number(incident.count) ? Number(Number(incident.average_minutes).toFixed(2)) : null, "minutes", "incidents", Number(incident.count) ? undefined : "Nenhum incidente resolvido no período."),
      metric("test_success_rate", totalTests ? Number(((Number(test.passed) / totalTests) * 100).toFixed(2)) : null, "percentage", "pipeline_runs", totalTests ? undefined : "Nenhum resultado de testes registrado no período."),
    ] };
  });

  return app;
}
