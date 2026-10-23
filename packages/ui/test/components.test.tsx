import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  PixelIcon,
  ScopeTabs,
  StatBar,
  TaskCard,
} from "../src/pixel.js";

describe("contratos acessíveis da UI", () => {
  it("botão não submete formulários implicitamente e aceita nome acessível", () => {
    const html = renderToStaticMarkup(
      <Button disabled aria-label="Concluir">
        <PixelIcon name="check" />
      </Button>,
    );
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Concluir"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-hidden="true"');
  });
  it("ícone informativo tem nome e papel de imagem", () => {
    const html = renderToStaticMarkup(
      <PixelIcon name="sword" label="Em batalha" />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Em batalha"');
    expect(html).not.toContain('aria-hidden="true"');
  });
  it.each([
    [140, 100, 100],
    [-5, 100, 0],
    [NaN, 100, 0],
    [10, 0, 10],
    [10, Infinity, 10],
  ])("barra mantém valores válidos (%s/%s)", (value, max, expected) => {
    const html = renderToStaticMarkup(
      <StatBar label="XP" value={value} max={max} />,
    );
    expect(html).toContain(`aria-valuenow="${expected}"`);
    expect(html).toContain('aria-valuemax="100"');
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });
  it("apenas a aba selecionada participa da tabulação e aponta para seu painel", () => {
    const html = renderToStaticMarkup(
      <ScopeTabs
        id="missions"
        value="weekly"
        onChange={() => {}}
        counts={{ daily: 2, weekly: 6, yearly: 20 }}
      />,
    );
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain(
      'id="missions-tab-weekly" aria-controls="missions-panel-weekly" aria-selected="true" tabindex="0"',
    );
  });
  it("estado do cartão tem descrição textual, sem depender da cor", () => {
    const html = renderToStaticMarkup(
      <TaskCard title="Minha missão" status="done" compact />,
    );
    expect(html).toContain('aria-label="Conquistada"');
    expect(html).toContain("Minha missão");
    expect(html).toContain("px-task-card--compact");
  });
});
