// Importa os deploys da Vercel para os KPIs (frequência, taxa de falha, rollback...).
//
// A Vercel, neste repositório, não cria "deployments" no GitHub: ela publica um
// status no commit, com contexto "Vercel – <projeto>" ("pending" quando começa,
// "success"/"failure"/"error" quando termina). Este script lê esses status nos
// commits que entraram direto no branch de produção (git log --first-parent:
// merges e pushes no main). Commits de branches de feature também aparecem no
// histórico, mas o status deles é de preview, não de produção.
// Reenviar o mesmo deploy não duplica: a API faz upsert pela chave
// (environment, version, status, completed_at).
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const VERCEL_BOT = "vercel[bot]";
const TERMINAL_STATES = new Set(["success", "failure", "error"]);

/** Projetos da Vercel lidos a partir do contexto do status ("Vercel – tasks-organization"). */
export function vercelProject(context) {
  const match = /^Vercel\s+[–-]\s+(.+)$/.exec(context ?? "");
  return match ? match[1].trim() : undefined;
}

/**
 * Converte os status de um commit em um deploy por projeto da Vercel.
 * Ignora projetos pulados ("Skipped - Not affected"), cancelados e deploys ainda em andamento.
 */
export function deploymentsFromStatuses(sha, statuses, projects) {
  const byProject = new Map();
  for (const status of statuses) {
    if (status.creator?.login !== VERCEL_BOT) continue;
    const project = vercelProject(status.context);
    if (!project || (projects.size > 0 && !projects.has(project))) continue;
    if (!byProject.has(project)) byProject.set(project, []);
    byProject.get(project).push(status);
  }

  const deployments = [];
  for (const [project, projectStatuses] of byProject) {
    const ordered = [...projectStatuses].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const terminal = ordered.filter((status) => TERMINAL_STATES.has(status.state)).at(-1);
    if (!terminal) continue;
    const description = terminal.description ?? "";
    if (/^(skipped|canceled|cancelled)/i.test(description)) continue;
    const started = ordered.find((status) => status.state === "pending" && status.created_at <= terminal.created_at);
    deployments.push({
      environment: "production",
      version: `vercel-${project}-${sha.slice(0, 12)}`.slice(0, 120),
      commitSha: sha,
      status: terminal.state === "success" ? "success" : "failure",
      workflowRunId: `${project}-${sha.slice(0, 12)}`.slice(0, 80),
      startedAt: (started ?? terminal).created_at,
      completedAt: terminal.created_at,
    });
  }
  return deployments;
}

async function main() {
  const apiUrl = process.env.KPI_API_URL?.replace(/\/$/, "");
  const secret = process.env.KPI_INGEST_SECRET;
  const githubToken = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const branch = process.env.KPI_DEPLOYMENT_BRANCH ?? "origin/main";
  const days = Number(process.env.KPI_DEPLOYMENT_LOOKBACK_DAYS ?? 90);
  const projects = new Set((process.env.VERCEL_PROJECTS ?? "").split(",").map((value) => value.trim()).filter(Boolean));

  if (!apiUrl || !secret || !githubToken || !repository) {
    throw new Error("KPI_API_URL, KPI_INGEST_SECRET, GITHUB_TOKEN e GITHUB_REPOSITORY são obrigatórios.");
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("KPI_DEPLOYMENT_LOOKBACK_DAYS deve ser um inteiro entre 1 e 90.");

  const githubHeaders = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${githubToken}`,
    "x-github-api-version": "2022-11-28",
  };
  const github = async (path) => {
    const response = await fetch(`https://api.github.com${path}`, { headers: githubHeaders });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
    return response.json();
  };
  const publish = async (payload) => {
    const response = await fetch(`${apiUrl}/internal/kpis/deployments`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-kpi-secret": secret },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`KPI API ${response.status}: ${await response.text()}`);
  };

  // Precisa do histórico completo (actions/checkout com fetch-depth: 0).
  const shas = execFileSync("git", ["log", "--first-parent", `--since=${days} days ago`, "--format=%H", branch], { encoding: "utf8" })
    .split("\n").map((line) => line.trim()).filter(Boolean);
  let synchronized = 0;
  for (const sha of shas) {
    const statuses = await github(`/repos/${repository}/commits/${sha}/statuses?per_page=100`);
    for (const deployment of deploymentsFromStatuses(sha, statuses, projects)) {
      await publish(deployment);
      synchronized += 1;
    }
  }
  console.log(`Vercel KPI synchronization complete: ${synchronized} deployment(s) from ${shas.length} commit(s) on ${branch}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
