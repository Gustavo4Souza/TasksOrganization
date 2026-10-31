"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Panel, RoomMap, StatBar, Tag, type MapRoom } from "@tasksorg/ui";
import "@tasksorg/ui/styles.css";
import "./kpis.css";

type Period = "7d" | "30d" | "90d";

const samples = {
  "7d": { deployments: 8, failure: 12, mttr: "38 min", tests: 96, pipelines: 24 },
  "30d": { deployments: 31, failure: 9, mttr: "44 min", tests: 94, pipelines: 108 },
  "90d": { deployments: 86, failure: 11, mttr: "52 min", tests: 92, pipelines: 296 },
} satisfies Record<Period, { deployments: number; failure: number; mttr: string; tests: number; pipelines: number }>;

function deploymentRooms(period: Period): MapRoom[] {
  const total = period === "7d" ? 7 : period === "30d" ? 15 : 18;
  return Array.from({ length: total }, (_, index) => {
    const level = (index % 5 === 0 ? 0 : index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 1) as 0 | 1 | 2 | 3;
    return { id: `${period}-${index}`, label: String(index + 1).padStart(2, "0"), level, current: index === total - 1, description: `Dia ${index + 1}: ${level} deploys bem-sucedidos` };
  });
}

export function KpiPrototype() {
  const [period, setPeriod] = useState<Period>("30d");
  const metrics = samples[period];
  const rooms = useMemo(() => deploymentRooms(period), [period]);

  return <main className="kpi-screen">
    <header className="kpi-header">
      <div><Link href="/design">← Voltar ao Design System</Link><p>TasksOrg / Observatório DevOps</p><h1>Saúde da jornada</h1></div>
      <Tag tone="arcane">Protótipo</Tag>
    </header>
    <nav className="kpi-periods" aria-label="Período dos indicadores">
      {(["7d", "30d", "90d"] as const).map((value) => <Button key={value} variant={period === value ? "primary" : "secondary"} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "7d" ? "7 dias" : value === "30d" ? "30 dias" : "90 dias"}</Button>)}
    </nav>
    <section className="kpi-grid" aria-label="Indicadores principais">
      <Panel title="Deployments" className="kpi-card"><p className="kpi-value">{metrics.deployments}</p><p>entregas no período</p><Tag tone="moss">Ritmo estável</Tag></Panel>
      <Panel title="Taxa de falha" className="kpi-card"><p className="kpi-value">{metrics.failure}%</p><StatBar label="Deploys com falha" value={metrics.failure} max={100} /><Tag tone={metrics.failure <= 10 ? "moss" : "gold"}>{metrics.failure <= 10 ? "Dentro da meta" : "Atenção"}</Tag></Panel>
      <Panel title="MTTR" className="kpi-card"><p className="kpi-value">{metrics.mttr}</p><p>tempo médio de recuperação</p><Tag tone="mana">Meta: até 60 min</Tag></Panel>
      <Panel title="Testes" className="kpi-card"><p className="kpi-value">{metrics.tests}%</p><StatBar label="Pipelines aprovados" value={metrics.tests} max={100} /><p>{metrics.pipelines} pipelines observados</p></Panel>
    </section>
    <Panel title="Mapa de deploys" className="kpi-map-panel">
      <p>Cada sala representa um dia; quanto mais explorada, mais deploys concluídos.</p>
      <RoomMap label={`Deploys nos últimos ${period === "7d" ? 7 : period === "30d" ? 30 : 90} dias`} rooms={rooms} columns={period === "7d" ? 7 : 6} />
    </Panel>
    <p className="kpi-note">Dados demonstrativos para validar hierarquia, leitura à distância e filtros. A conexão real depende dos endpoints da T3.2.5.</p>
  </main>;
}
