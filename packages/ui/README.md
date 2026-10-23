# @tasksorg/ui

Pacote compartilhado do Design System pixel do TasksOrg para Web e Desktop.

## Estado atual

A `T0.2.1` estabelece a infraestrutura do pacote:

- build TypeScript com declarações (`.d.ts`);
- export público de componentes;
- export público de `styles.css`;
- configuração de lint e typecheck;
- integração com o workspace pnpm e as tarefas do Turborepo;
- entrada CSS preparada para receber tokens e estilos dos componentes.

O pacote também oferece tokens, classes `px-*` e os componentes `Panel`,
`Button`, `Tag`, `PixelIcon`, `TaskCard`, `StatBar` e `ScopeTabs`.
Veja `/design` no Web para exemplos interativos nos dois temas e
[`docs/MVP0-Higor.md`](../../docs/MVP0-Higor.md) para contratos de acessibilidade
e pendências de comparação com a referência visual original.

## Tokens (T0.2.2 e T0.2.3)

A fonte das cores, medidas e fontes é `tokens/tokens.json`, copiado do
[Design System TasksOrg](https://claude.ai/artifact/1CWD4ogZnHRhc5SyxuQnJe).
O arquivo `styles/tokens.css` é **gerado** a partir dele:

```bash
pnpm --filter @tasksorg/ui tokens   # regenera styles/tokens.css
```

Nunca edite o `tokens.css` à mão: o build e os testes falham se ele estiver
diferente do que o `tokens.json` gera.

O CSS gerado tem:

- **Temas:** `:root` e `[data-theme="castelo"]` (escuro, padrão) e `[data-theme="pergaminho"]` (claro), cada um com seu `color-scheme`.
- **Cores:** `--bg`, `--surface`, `--surface-raised`, `--surface-sunken`, `--edge`, `--edge-soft`, `--ink`, `--ink-muted`, `--gold`, `--mana`, `--moss`, `--crimson`, `--arcane`, `--on-accent`, `--shadow-ink`, `--focus-ring`.
- **Sombras:** `--shadow-drop`, `--shadow-press`, `--shadow-bevel`.
- **Medidas:** `--space-1` a `--space-8`, `--radius-0`, `--border-px`, `--border-thin`, `--hud-height`, `--sidebar-width`, `--card-min-height`.
- **Fontes:** `--font-display`, `--font-body`, `--font-digits`, e as classes `.px-type-title`, `heading`, `body`, `body-sm`, `label`, `timer` e `counter`.

No Next.js as fontes vêm do `next/font`, que gera nomes próprios. Aponte as
famílias para as variáveis dele no app:
`:root { --font-display: var(--font-silkscreen); --font-body: var(--font-pixelify); --font-digits: var(--font-jersey); }`.

### Contraste

`test/tokens.test.mjs` confere, nos dois temas, as regras de `CONTRAST_RULES`
(`scripts/tokens.mjs`): texto ≥ 4.5:1 sobre as superfícies e sobre os
preenchimentos de acento; borda e anel de foco ≥ 3:1. Uma cor nova que deixe
algum texto ilegível faz o `pnpm test` (e o CI) falhar, mostrando o par e a razão.

Imports disponíveis: `@tasksorg/ui/styles.css` (tokens + componentes),
`@tasksorg/ui/tokens.css` (só as variáveis) e `@tasksorg/ui/tokens.json`.

## Uso

Depois de importar o pacote no app consumidor:

```tsx
import "@tasksorg/ui/styles.css";
```

Os componentes podem ser importados pela entrada principal ou pela entrada
específica:

```tsx
import { type PolymorphicProps } from "@tasksorg/ui";
// ou
import { type PolymorphicProps } from "@tasksorg/ui/components";
```

## Desenvolvimento

Na raiz do monorepo:

```bash
pnpm --filter @tasksorg/ui build
pnpm --filter @tasksorg/ui lint
pnpm --filter @tasksorg/ui typecheck
```

O build gera os arquivos JavaScript e declarações em `dist/`, além de copiar
`styles/index.css` para `dist/styles.css`.
