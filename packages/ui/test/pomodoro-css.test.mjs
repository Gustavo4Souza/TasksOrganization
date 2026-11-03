import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles/index.css", import.meta.url), "utf8");

describe("PomodoroHUD", () => {
  it("centraliza o conteúdo no corpo do Panel, que é onde ele é renderizado", () => {
    expect(css).toMatch(/\.px-pomo \.px-panel__body\s*\{[^}]*align-items:\s*center/);
  });
});
