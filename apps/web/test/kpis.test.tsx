// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { KpiPrototype } from "../app/design/kpis/kpi-prototype";

afterEach(cleanup);

describe("Protótipo de KPIs", () => {
  it("mostra os quatro indicadores e troca o período", () => {
    render(<KpiPrototype />);
    const indicators = screen.getByRole("region", { name: "Indicadores principais" });
    for (const name of ["Deployments", "Taxa de falha", "MTTR", "Testes"]) expect(within(indicators).getByRole("heading", { name })).toBeTruthy();
    expect(screen.getByText("31")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Deploys nos últimos 7 dias" }).children).toHaveLength(7);
  });
});
