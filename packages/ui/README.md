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

Os tokens, as classes `px-*` e os componentes visuais serão adicionados nas
tasks seguintes do épico 0.2.

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

## Pomodoro: `usePomodoro` e `usePomodoroSettings` (T1.3.1 e T1.3.6)

```tsx
"use client";
import { TaskStore, creditFocusToBattle } from "@tasksorg/core";
import { usePomodoro, usePomodoroSettings } from "@tasksorg/ui/hooks";

const { config, update, restoreDefaults } = usePomodoroSettings();
const { snapshot, toggle, reset, skip } = usePomodoro({
  config,
  // Liga o Pomodoro às tarefas antes de descontar o tempo em que o app ficou fechado.
  attach: (timer) => creditFocusToBattle(timer, store, (task) => repository.save(task)),
  onPhaseChange: (change) => tocarSom(change.to), // T1.3.4
});
// snapshot: { phase, state, remainingSeconds, completedFocusCycles }
```

- **Relógio real:** o tempo é medido pelo relógio do sistema, não pela contagem do `setInterval`. Em aba de segundo plano o navegador atrasa o intervalo, e mesmo assim o relógio fica certo.
- **Recarregar a página:** o estado fica salvo no `localStorage` (`tasksorg:pomodoro`). Ao abrir de novo, o tempo que passou é descontado, **no máximo até o fim da fase em que parou**. Quem fecha o app no meio de um Foco e volta horas depois recebe aquele Foco concluído, não vários ciclos que não fez.
- **`attach`:** é lido só na montagem. Use para `creditFocusToBattle`: assim o Foco concluído enquanto o app estava fechado também é creditado.
- **`skip`:** pula a fase. Um Foco pulado não conta ciclo nem credita pomodoro.
- **`usePomodoroSettings`:** guarda os tempos em `tasksorg:pomodoro-config`. Os valores são normalizados (Foco de 1 a 120 min, pausa curta de 1 a 60, pausa longa de 1 a 90, de 1 a 12 ciclos) e passar `config` para o `usePomodoro` aplica a mudança na próxima fase.
- **SSR:** funcionam no servidor (Next). O primeiro render mostra 25:00 e o estado salvo entra logo depois.
- **Sem persistência:** `storage: null` desliga o salvamento; testes podem passar um `storage` e um `now` falsos.

## Desenvolvimento

Na raiz do monorepo:

```bash
pnpm --filter @tasksorg/ui build
pnpm --filter @tasksorg/ui lint
pnpm --filter @tasksorg/ui typecheck
```

O build gera os arquivos JavaScript e declarações em `dist/`, além de copiar
`styles/index.css` para `dist/styles.css`.
