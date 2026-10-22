// Lê o tokens.json do Design System e gera o CSS com as variáveis dos temas.
// Funções puras: o script build-tokens.mjs grava o arquivo e os testes chamam daqui.

const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const ALIAS = /^\{([^}]+)\}$/;

export const HEADER =
  "/* Gerado por scripts/build-tokens.mjs a partir de tokens/tokens.json. Não edite à mão:\n" +
  " * altere o tokens.json (fonte: Design System TasksOrg) e rode `pnpm --filter @tasksorg/ui tokens`. */\n";

/** @param {string} hex */
function hexToRgb(hex) {
  const h = hex.slice(1);
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

/** Luminância relativa (WCAG 2). @param {string} hex */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2 entre duas cores hex (1 a 21). */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Valor de um token num tema; string simples vale para todos, e tema ausente herda o primeiro. */
function valueFor(value, themeId, firstThemeId) {
  return typeof value === "string" ? value : (value[themeId] ?? value[firstThemeId]);
}

/**
 * Confere a estrutura e devolve os temas e um índice das cores.
 * Lança erro com mensagem clara em vez de gerar CSS quebrado.
 */
export function validateTokens(tokens) {
  const themes = tokens?.color?.themes;
  if (!Array.isArray(themes) || themes.length === 0) throw new Error("tokens.json: color.themes precisa ter ao menos um tema.");
  const colors = new Map();
  const seen = new Set();
  const families = ["color", "shadow", "spacing", "radius", "border", "layout"];
  for (const family of families) {
    for (const token of tokens[family]?.tokens ?? []) {
      if (!NAME.test(token.name)) throw new Error(`tokens.json: nome inválido "${token.name}" em ${family}.`);
      if (seen.has(token.name)) throw new Error(`tokens.json: token "${token.name}" repetido.`);
      seen.add(token.name);
      if (family === "color") colors.set(token.name, token);
    }
  }
  for (const theme of themes) {
    for (const [name] of colors) resolveColor(tokens, name, theme.id, colors);
  }
  return { themes, colors };
}

/** Resolve aliases ({gold}) até chegar num hex. */
export function resolveColor(tokens, name, themeId, colors = new Map(tokens.color.tokens.map((t) => [t.name, t])), depth = 0) {
  const token = colors.get(name);
  if (!token) throw new Error(`tokens.json: cor "${name}" não existe.`);
  if (depth > 16) throw new Error(`tokens.json: alias em ciclo a partir de "${name}".`);
  const raw = valueFor(token.value, themeId, tokens.color.themes[0].id);
  const alias = typeof raw === "string" ? ALIAS.exec(raw) : null;
  if (alias) return resolveColor(tokens, alias[1], themeId, colors, depth + 1);
  if (typeof raw !== "string" || !HEX.test(raw)) throw new Error(`tokens.json: cor "${name}" no tema "${themeId}" não é hex (#rgb ou #rrggbb): ${raw}`);
  return raw.toLowerCase();
}

const SURFACES = ["bg", "surface", "surface-raised"];
const ACCENTS = ["gold", "mana", "moss", "crimson", "arcane"];

/**
 * Pares que precisam de contraste em TODOS os temas (WCAG 2 AA):
 * 4.5:1 para texto, 3:1 para bordas e anel de foco (elementos que não são texto).
 */
export const CONTRAST_RULES = [
  { label: "texto sobre superfícies", fg: ["ink", "ink-muted", ...ACCENTS], bg: SURFACES, min: 4.5 },
  { label: "texto sobre preenchimento de acento", fg: ["on-accent"], bg: ACCENTS, min: 4.5 },
  { label: "borda de controle", fg: ["edge"], bg: SURFACES, min: 3 },
  { label: "anel de foco", fg: ["focus-ring"], bg: SURFACES, min: 3 },
];

/** Lista todos os pares abaixo do mínimo. Vazia = tudo certo. */
export function contrastFailures(tokens, rules = CONTRAST_RULES) {
  const { themes } = validateTokens(tokens);
  const failures = [];
  for (const theme of themes) {
    for (const rule of rules) {
      for (const fg of rule.fg) {
        for (const bg of rule.bg) {
          const ratio = contrastRatio(resolveColor(tokens, fg, theme.id), resolveColor(tokens, bg, theme.id));
          if (ratio < rule.min) failures.push({ theme: theme.id, rule: rule.label, fg, bg, ratio: Math.round(ratio * 100) / 100, min: rule.min });
        }
      }
    }
  }
  return failures;
}

/** Valor CSS de uma cor: alias vira var(--outro), hex fica como está. */
function cssColor(token, themeId, firstThemeId) {
  const raw = valueFor(token.value, themeId, firstThemeId);
  const alias = ALIAS.exec(raw);
  return alias ? `var(--${alias[1]})` : raw.toLowerCase();
}

function kebab(prop) {
  return prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Gera o tokens.css completo. */
export function buildTokensCss(tokens) {
  const { themes } = validateTokens(tokens);
  const first = themes[0].id;
  const out = [HEADER];

  for (const theme of themes) {
    const selector = theme.id === first ? `:root,\n[data-theme="${theme.id}"]` : `[data-theme="${theme.id}"]`;
    const scheme = luminance(resolveColor(tokens, "bg", theme.id)) < 0.5 ? "dark" : "light";
    out.push(`\n/* Tema ${theme.name} */\n${selector} {\n  color-scheme: ${scheme};\n`);
    for (const token of tokens.color.tokens) out.push(`  --${token.name}: ${cssColor(token, theme.id, first)};\n`);
    for (const token of tokens.shadow?.tokens ?? []) out.push(`  --${token.name}: ${valueFor(token.value, theme.id, first)};\n`);
    out.push("}\n");
  }

  out.push("\n/* Medidas e famílias (iguais nos dois temas) */\n:root {\n");
  for (const family of ["spacing", "radius", "border", "layout"]) {
    for (const token of tokens[family]?.tokens ?? []) out.push(`  --${token.name}: ${token.value};\n`);
  }
  for (const [key, stack] of Object.entries(tokens.type?.families ?? {})) out.push(`  --font-${key}: ${stack};\n`);
  out.push("}\n");

  out.push("\n/* Estilos de texto: aplique com class=\"px-type-<nome>\" */\n");
  for (const group of tokens.type?.groups ?? []) {
    for (const style of group.styles) {
      out.push(`.px-type-${style.name} {\n  font-family: var(--font-${style.family ?? group.family});\n`);
      for (const prop of ["fontSize", "lineHeight", "fontWeight", "letterSpacing"]) {
        if (style[prop] !== undefined) out.push(`  ${kebab(prop)}: ${style[prop]};\n`);
      }
      out.push("}\n");
    }
  }
  return out.join("");
}
