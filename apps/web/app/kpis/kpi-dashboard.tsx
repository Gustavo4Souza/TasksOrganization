"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Panel, StatBar, Tag } from "@tasksorg/ui";
import { loadKpis, type KpiQuality, type KpiRecord } from "./kpi-client";
import "@tasksorg/ui/styles.css";
import "./kpis.css";

type Period = "7d" | "30d" | "90d";
type LoadState = "idle" | "loading" | "ready" | "error";

const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const definitions = [
  { id: "deployment_frequency", title: "Frequência de implantação", unit: "count" },
  { id: "lead_time_for_changes", title: "Lead time de mudanças", unit: "minutes" },
  { id: "change_failure_rate", title: "Taxa de falha de alterações", unit: "percentage" },
  { id: "mttr", title: "MTTR", unit: "minutes" },
  { id: "pipeline_success_rate", title: "Sucesso do pipeline", unit: "percentage" },
  { id: "pipeline_duration", title: "Duração do pipeline", unit: "minutes" },
  { id: "test_success_rate", title: "Sucesso dos testes", unit: "percentage" },
  { id: "test_coverage", title: "Cobertura de testes", unit: "percentage" },
  { id: "escaped_defect_rate", title: "Defeitos escapados", unit: "percentage" },
  { id: "rollback_hotfix_rate", title: "Rollback / hotfix", unit: "percentage" },
  { id: "flaky_test_rate", title: "Testes instáveis", unit: "percentage" },
  { id: "sast_findings_by_severity", title: "Achados SAST", unit: "count" },
  { id: "vulnerability_remediation_time", title: "Correção de vulnerabilidades", unit: "minutes" },
  { id: "dependency_vulnerability_count", title: "Vulnerabilidades de dependências", unit: "count" },
  { id: "secret_scan_findings", title: "Achados de secret scanning", unit: "count" },
  { id: "sast_false_positive_rate", title: "Falsos positivos SAST", unit: "percentage" },
  { id: "availability", title: "Disponibilidade", unit: "percentage" },
  { id: "application_error_rate", title: "Taxa de erro", unit: "percentage" },
  { id: "latency_p50_p95_p99", title: "Latência P50 / P95 / P99", unit: "minutes" },
  { id: "critical_operation_success_rate", title: "Operações críticas", unit: "percentage" },
] as const;

const qualityLabel: Record<KpiQuality, string> = { complete: "Completo", partial: "Parcial", unavailable: "Indisponível" };
const qualityTone = (quality: KpiQuality) => quality === "complete" ? "moss" : quality === "partial" ? "gold" : "crimson";

function displayValue(metric: KpiRecord | undefined, unit: string): string {
  if (!metric || metric.value === null || metric.data_quality === "unavailable") return "—";
  const value = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(metric.value);
  if (unit === "percentage") return `${value}%`;
  if (unit === "minutes") return `${value} min`;
  return value;
}

export function KpiDashboard({ apiBaseUrl = defaultApiUrl }: { apiBaseUrl?: string }) {
  const [period, setPeriod] = useState<Period>("30d");
  const [state, setState] = useState<LoadState>("idle");
  const [metrics, setMetrics] = useState<KpiRecord[]>([]);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!apiBaseUrl) { setState("error"); setError("A fonte de KPIs ainda não foi configurada."); setMetrics([]); return; }
    const controller = new AbortController();
    setState("loading"); setError("");
    void loadKpis(apiBaseUrl, period, controller.signal).then((result) => {
      setMetrics(result.metrics); setState("ready");
    }).catch((reason: unknown) => {
      if (controller.signal.aborted) return;
      setMetrics([]); setError(reason instanceof Error ? reason.message : "Os indicadores estão indisponíveis no momento."); setState("error");
    });
    return () => controller.abort();
  }, [apiBaseUrl, period, revision]);

  const latest = useMemo(() => new Map(metrics.map((metric) => [metric.metric_id, metric])), [metrics]);
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  return <main className="metrics-screen">
    <header className="metrics-header"><div><Link href="/">← Voltar ao Quadro</Link><p>TasksOrg / Indicadores DevOps</p><h1>Saúde da entrega</h1></div><Tag tone={state === "ready" ? "moss" : "gold"}>{state === "ready" ? "Dados reais" : "Aguardando dados"}</Tag></header>
    <nav className="metrics-periods" aria-label="Período dos indicadores">
      {(["7d", "30d", "90d"] as const).map((value) => <Button key={value} variant={period === value ? "primary" : "secondary"} aria-pressed={period === value} onClick={() => setPeriod(value)} disabled={state === "loading"}>{value === "7d" ? "7 dias" : value === "30d" ? "30 dias" : "90 dias"}</Button>)}
    </nav>
    {state === "loading" && <div className="metrics-loading" role="status"><span /><span /><span /> Consultando fontes...</div>}
    {state === "error" && <div className="metrics-error" role="alert"><p>{error}</p>{apiBaseUrl && <Button variant="secondary" onClick={retry}>Tentar novamente</Button>}</div>}
    <section className="metrics-grid" aria-label="Indicadores principais">
      {definitions.map((definition) => {
        const metric = latest.get(definition.id);
        const quality = metric?.data_quality ?? "unavailable";
        return <Panel key={definition.id} title={definition.title} className="metrics-card">
          <p className="metrics-value">{displayValue(metric, definition.unit)}</p>
          {definition.unit === "percentage" && metric?.value !== null && metric?.value !== undefined && <StatBar label={definition.title} value={metric.value} max={100} />}
          <Tag tone={qualityTone(quality)}>{qualityLabel[quality]}</Tag>
          <p>{metric?.notes || (quality === "unavailable" ? "Fonte ainda não disponível." : `Fonte: ${metric?.source ?? "não informada"}`)}</p>
        </Panel>;
      })}
    </section>
    <Panel title="Histórico e origem" className="metrics-history">
      {metrics.length === 0 ? <p>Nenhum registro recebido para este período.</p> : <div className="metrics-table-wrap"><table><thead><tr><th>Métrica</th><th>Janela</th><th>Fonte</th><th>Qualidade</th></tr></thead><tbody>{metrics.map((metric, index) => <tr key={`${metric.metric_id}-${metric.period_end}-${index}`}><td>{metric.metric_id}</td><td><time dateTime={metric.period_start}>{new Date(metric.period_start).toLocaleDateString("pt-BR")}</time> – <time dateTime={metric.period_end}>{new Date(metric.period_end).toLocaleDateString("pt-BR")}</time></td><td>{metric.source}</td><td>{qualityLabel[metric.data_quality]}</td></tr>)}</tbody></table></div>}
    </Panel>
  </main>;
}
