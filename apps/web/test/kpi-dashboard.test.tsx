// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { KpiDashboard } from "../app/kpis/kpi-dashboard";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const metrics = [
  { metric_id: "deployment_frequency", period_start: "2026-10-01T00:00:00Z", period_end: "2026-10-30T23:59:59Z", value: 31, unit: "count", source: "deployments", collected_at: "2026-10-31T00:05:00Z", owner: "Guilhermo", data_quality: "complete" },
  { metric_id: "change_failure_rate", period_start: "2026-10-01T00:00:00Z", period_end: "2026-10-30T23:59:59Z", value: 9, unit: "percentage", source: "incidents", collected_at: "2026-10-31T00:05:00Z", owner: "Gustavo", data_quality: "partial", notes: "Incidentes em homologação ainda não entram." },
  { metric_id: "mttr", period_start: "2026-10-01T00:00:00Z", period_end: "2026-10-30T23:59:59Z", value: null, unit: "minutes", source: "monitoring", collected_at: "2026-10-31T00:05:00Z", owner: "Guilhermo", data_quality: "unavailable", notes: "Sem incidentes registrados." },
  { metric_id: "test_success_rate", period_start: "2026-10-01T00:00:00Z", period_end: "2026-10-30T23:59:59Z", value: 94, unit: "percentage", source: "github-actions", collected_at: "2026-10-31T00:05:00Z", owner: "Gustavo", data_quality: "complete" },
] as const;

describe("Tela real de KPIs", () => {
  it("não inventa valores quando a API ainda não está configurada", async () => {
    render(<KpiDashboard apiBaseUrl="" />);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("ainda não foi configurada"));
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("mostra métricas, qualidade e histórico recebidos da API", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ metrics }), { status: 200, headers: { "content-type": "application/json" } })));
    vi.stubGlobal("fetch", fetchMock);
    render(<KpiDashboard apiBaseUrl="https://api.example.test" />);
    expect(await screen.findByText("31")).toBeTruthy();
    expect(screen.getByText("9%")).toBeTruthy();
    expect(screen.getByText("94%")).toBeTruthy();
    expect(screen.getByText("Sem incidentes registrados.")).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("https://api.example.test/kpis?period=7d", expect.objectContaining({ credentials: "include" })));
  });
});
