import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildTokensCss, contrastFailures, contrastRatio, resolveColor, validateTokens } from "../scripts/tokens.mjs";

const tokens = JSON.parse(await readFile(new URL("../tokens/tokens.json", import.meta.url), "utf8"));
const committedCss = (await readFile(new URL("../styles/tokens.css", import.meta.url), "utf8")).replace(/\r\n/g, "\n");

/** Cópia do tokens.json com uma cor trocada num tema. */
function withColor(name, themeId, value) {
  const copy = structuredClone(tokens);
  const token = copy.color.tokens.find((t) => t.name === name);
  token.value = typeof token.value === "string" ? { [themeId]: value } : { ...token.value, [themeId]: value };
  return copy;
}

describe("contraste dos tokens (T0.2.3)", () => {
  it("todo par de texto, borda e foco passa o mínimo WCAG nos temas Castelo e Pergaminho", () => {
    const failures = contrastFailures(tokens);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  it("acusa uma cor de texto que ficaria ilegível", () => {
    const failures = contrastFailures(withColor("ink-muted", "pergaminho", "#c9bfa5"));
    expect(failures).toContainEqual(expect.objectContaining({ theme: "pergaminho", fg: "ink-muted", bg: "bg" }));
  });

  it("confere o tema escuro também, não só o primeiro", () => {
    const failures = contrastFailures(withColor("on-accent", "castelo", "#f4c542"));
    expect(failures.some((f) => f.theme === "castelo" && f.fg === "on-accent")).toBe(true);
  });

  it("calcula a razão de contraste igual à WCAG", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});

describe("geração do tokens.css (T0.2.2)", () => {
  it("styles/tokens.css commitado está igual ao gerado a partir do tokens.json", () => {
    // Se falhar: rode `pnpm --filter @tasksorg/ui tokens` e commite o resultado.
    expect(committedCss).toBe(buildTokensCss(tokens));
  });

  it("gera um bloco por tema, com o primeiro também em :root", () => {
    const css = buildTokensCss(tokens);
    expect(css).toContain(':root,\n[data-theme="castelo"] {\n  color-scheme: dark;');
    expect(css).toContain('[data-theme="pergaminho"] {\n  color-scheme: light;');
    expect(css).toContain("--bg: #0e0c1d;");
    expect(css).toContain("--bg: #e6d8b5;");
  });

  it("alias vira var() e é resolvido para o hex do tema", () => {
    expect(buildTokensCss(tokens)).toContain("--focus-ring: var(--gold);");
    expect(resolveColor(tokens, "focus-ring", "pergaminho")).toBe("#7f5200");
  });

  it("inclui medidas, famílias de fonte e classes de texto", () => {
    const css = buildTokensCss(tokens);
    expect(css).toContain("--space-4: 16px;");
    expect(css).toContain("--hud-height: 64px;");
    expect(css).toContain('--font-display: "Silkscreen", "Courier New", monospace;');
    expect(css).toMatch(/\.px-type-timer \{\n {2}font-family: var\(--font-digits\);\n {2}font-size: 112px;/);
  });

  it("recusa alias para cor inexistente", () => {
    expect(() => validateTokens(withColor("focus-ring", "castelo", "{ouro}"))).toThrow(/ouro/);
  });

  it("recusa cor que não é hex", () => {
    expect(() => validateTokens(withColor("gold", "castelo", "gold"))).toThrow(/não é hex/);
  });

  it("recusa nome de token repetido", () => {
    const copy = structuredClone(tokens);
    copy.spacing.tokens.push({ name: "bg", value: "1px" });
    expect(() => validateTokens(copy)).toThrow(/repetido/);
  });
});
