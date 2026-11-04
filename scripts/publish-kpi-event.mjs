const endpointByType = {
  deployment: "/internal/kpis/deployments",
  incident: "/internal/kpis/incidents",
  pipeline: "/internal/kpis/pipelines",
};

const apiUrl = process.env.KPI_API_URL?.replace(/\/$/, "");
const secret = process.env.KPI_INGEST_SECRET;
const type = process.env.KPI_EVENT_TYPE;
const payloadText = process.env.KPI_PAYLOAD;

if (!apiUrl || !secret) {
  console.log("KPI collection skipped: KPI_API_URL/KPI_INGEST_SECRET not configured.");
  process.exit(0);
}
if (!type || !(type in endpointByType) || !payloadText) throw new Error("KPI_EVENT_TYPE/KPI_PAYLOAD inválidos.");

const payload = JSON.parse(payloadText);
const response = await fetch(`${apiUrl}${endpointByType[type]}`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-kpi-secret": secret },
  body: JSON.stringify(payload),
});
if (!response.ok) throw new Error(`KPI API returned ${response.status}: ${await response.text()}`);
console.log(`KPI ${type} event published.`);
