export type KpiQuality = "complete" | "partial" | "unavailable";

export interface KpiRecord {
  metric_id: string;
  period_start: string;
  period_end: string;
  value: number | null;
  unit: "count" | "percentage" | "minutes" | "hours" | "days";
  source: string;
  collected_at: string;
  owner: string;
  data_quality: KpiQuality;
  notes?: string;
}

export interface KpiResponse {
  metrics: KpiRecord[];
}

export async function loadKpis(apiBaseUrl: string, period: string, signal?: AbortSignal): Promise<KpiResponse> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/kpis?period=${encodeURIComponent(period)}`, {
    credentials: "include",
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Entre na sua conta para consultar os indicadores." : "Os indicadores estão indisponíveis no momento.");
  const payload = await response.json() as Partial<KpiResponse>;
  if (!Array.isArray(payload.metrics)) throw new Error("A API retornou um formato de indicadores inválido.");
  return { metrics: payload.metrics };
}
