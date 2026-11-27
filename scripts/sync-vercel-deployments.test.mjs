import assert from "node:assert/strict";
import test from "node:test";
import { deploymentsFromStatuses, vercelProject } from "./sync-vercel-deployments.mjs";

const SHA = "12ee379abcdef0123456789abcdef0123456789a";
const status = (context, state, createdAt, description = "", login = "vercel[bot]") => ({
  context, state, created_at: createdAt, description, creator: { login },
});

test("lê o projeto do contexto do status da Vercel", () => {
  assert.equal(vercelProject("Vercel – tasks-organization"), "tasks-organization");
  assert.equal(vercelProject("Vercel - tasksorg-api"), "tasksorg-api");
  assert.equal(vercelProject("CodeQL"), undefined);
});

test("gera um deploy por projeto, do pending ao status final", () => {
  const statuses = [
    status("Vercel – tasksorg-api", "success", "2026-11-27T21:24:22Z", "Deployment has completed"),
    status("Vercel – tasksorg-api", "pending", "2026-11-27T21:23:55Z", "Vercel is deploying your app"),
    status("Vercel – tasks-organization", "failure", "2026-11-27T21:25:00Z", "Deployment has failed"),
    status("Vercel – tasks-organization", "pending", "2026-11-27T21:23:50Z"),
  ];
  const deployments = deploymentsFromStatuses(SHA, statuses, new Set());
  assert.deepEqual(deployments.map((d) => [d.version, d.status, d.startedAt, d.completedAt]), [
    ["vercel-tasksorg-api-12ee379abcde", "success", "2026-11-27T21:23:55Z", "2026-11-27T21:24:22Z"],
    ["vercel-tasks-organization-12ee379abcde", "failure", "2026-11-27T21:23:50Z", "2026-11-27T21:25:00Z"],
  ]);
  assert.equal(deployments[0].commitSha, SHA);
  assert.equal(deployments[0].environment, "production");
});

test("ignora projetos pulados, cancelados, em andamento e status de outros autores", () => {
  const statuses = [
    status("Vercel – tasks-organization", "success", "2026-11-27T21:23:55Z", "Skipped - Not affected"),
    status("Vercel – tasksorg-api", "error", "2026-11-27T21:24:00Z", "Canceled by user"),
    status("Vercel – outro-projeto", "pending", "2026-11-27T21:24:00Z"),
    status("Vercel – falso", "success", "2026-11-27T21:24:00Z", "", "alguem"),
    status("CodeQL", "success", "2026-11-27T21:24:00Z"),
  ];
  assert.deepEqual(deploymentsFromStatuses(SHA, statuses, new Set()), []);
});

test("filtra pelos projetos configurados", () => {
  const statuses = [
    status("Vercel – tasksorg-api", "success", "2026-11-27T21:24:22Z"),
    status("Vercel – tasks-organization", "success", "2026-11-27T21:24:30Z"),
  ];
  const deployments = deploymentsFromStatuses(SHA, statuses, new Set(["tasks-organization"]));
  assert.deepEqual(deployments.map((d) => d.version), ["vercel-tasks-organization-12ee379abcde"]);
});
