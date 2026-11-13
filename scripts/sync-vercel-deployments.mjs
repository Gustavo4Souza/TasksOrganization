const apiUrl = process.env.KPI_API_URL?.replace(/\/$/, "");
const secret = process.env.KPI_INGEST_SECRET;
const githubToken = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const days = Number(process.env.KPI_DEPLOYMENT_LOOKBACK_DAYS ?? 90);
const vercelLogins = new Set((process.env.VERCEL_APP_LOGINS ?? "vercel[bot],vercel").split(",").map((value) => value.trim()).filter(Boolean));
const terminalStates = new Set(["success", "failure", "error"]);

if (!apiUrl || !secret || !githubToken || !repository) {
  throw new Error("KPI_API_URL, KPI_INGEST_SECRET, GITHUB_TOKEN e GITHUB_REPOSITORY são obrigatórios.");
}
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("KPI_DEPLOYMENT_LOOKBACK_DAYS deve ser um inteiro entre 1 e 90.");

const githubHeaders = {
  accept: "application/vnd.github+json",
  authorization: `Bearer ${githubToken}`,
  "x-github-api-version": "2022-11-28",
};
const cutoff = Date.now() - days * 86_400_000;

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers: githubHeaders });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.json();
}

async function publish(payload) {
  const response = await fetch(`${apiUrl}/internal/kpis/deployments`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-kpi-secret": secret },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`KPI API ${response.status}: ${await response.text()}`);
}

let synchronized = 0;
for (let page = 1; page <= 10; page += 1) {
  const deployments = await github(`/repos/${repository}/deployments?per_page=100&page=${page}`);
  if (deployments.length === 0) break;
  for (const deployment of deployments) {
    if (new Date(deployment.created_at).getTime() < cutoff) {
      page = 10;
      break;
    }
    if (!vercelLogins.has(deployment.creator?.login)) continue;
    const statuses = await github(`/repos/${repository}/deployments/${deployment.id}/statuses`);
    const terminal = statuses.find((status) => terminalStates.has(status.state));
    if (!terminal) continue;
    await publish({
      environment: deployment.environment || "production",
      version: `vercel-${deployment.id}`,
      commitSha: deployment.sha || process.env.GITHUB_SHA,
      status: terminal.state === "success" ? "success" : "failure",
      workflowRunId: String(deployment.id),
      startedAt: deployment.created_at,
      completedAt: terminal.created_at,
    });
    synchronized += 1;
  }
}

console.log(`Vercel KPI synchronization complete: ${synchronized} deployment(s).`);
