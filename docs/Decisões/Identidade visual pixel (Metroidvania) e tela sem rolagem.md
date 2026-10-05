**Categoria:** Produto / UI · **Status:** Proposta · **Data:** 2026-10-02

## Contexto

O TasksOrg foi pensado para ficar **aberto o tempo todo num monitor secundário**: o usuário olha de relance, conclui tarefas e muda o status delas ao longo do desenvolvimento, com o Pomodoro rodando junto. A POC atual (`apps/web/app/page.tsx`) tem um visual genérico, em uma coluna que rola.

## O que foi decidido

1. **Estilo pixel art, inspirado em Metroidvania** (castelo à noite, painéis de pedra, HUD de jogo), registrado como Design System próprio: [Design System TasksOrg](https://claude.ai/artifact/1CWD4ogZnHRhc5SyxuQnJe).
2. **Telas de referência** (protótipo interativo): [TasksOrg — Telas Pixel](https://claude.ai/artifact/Bk4WBV9v1PWYYX4mW4MdUS).
3. **Tela principal sem rolagem**: tudo cabe em `100vh`. Quando uma coluna enche, os cartões ficam compactos (36px) e o excedente vira "+N missões".
4. **Layout**: HUD no topo (abas Hoje/Semana/Ano, barra de XP do dia, campo "nova missão"), três colunas (Missões · Em batalha · Conquistas) e uma lateral com o Pomodoro e o mapa de progresso da semana e do ano.

### Paleta

Dois temas, com todo texto ≥ 4.5:1 de contraste (WCAG AA):

| Token | Castelo (escuro, padrão) | Pergaminho (claro) | Significado |
|---|---|---|---|
| `bg` | `#0e0c1d` | `#e6d8b5` | fundo |
| `surface` | `#1b1733` | `#f4ecd5` | painéis |
| `ink` | `#f1e9d2` | `#231933` | texto |
| `gold` | `#f4c542` | `#7f5200` | ação principal, XP, foco do teclado |
| `mana` | `#4fd3e3` | `#075f6b` | em andamento (`doing`), fase de Foco |
| `moss` | `#93dd62` | `#30631a` | concluído (`done`), pausas |
| `crimson` | `#ff6b78` | `#b01f3a` | prioridade alta, ações destrutivas |
| `arcane` | `#b897ff` | `#6a3cc2` | escopo Anual |

### Fontes (Google Fonts)

- **Silkscreen**: títulos e botões
- **Pixelify Sans**: texto
- **Jersey 10**: relógio e números

### Vocabulário (mapeado do `@tasksorg/core`)

| Core | Interface |
|---|---|
| `todo` / `doing` / `done` | Missões / Em batalha / Conquistas |
| `daily` / `weekly` / `yearly` | Hoje / Semana / Ano |
| `focus` / `shortBreak` / `longBreak` | Foco / Save point / Santuário |
| `completedFocusCycles` | orbes dourados (4 por ciclo) |

## Consequências / Próximos passos

- [ ] Grupo valida a proposta (paleta, vocabulário de jogo e layout) e muda o status para **Aceita**
- [ ] Levar os tokens e as classes `px-*` para o código (`packages/ui` ou `apps/web/app/globals.css`) e aplicar em `apps/web` e `apps/desktop` (o Electron reaproveita o mesmo CSS)
- [ ] Novo campo no core: quantos pomodoros foram gastos por tarefa (hoje o `Task` não guarda isso, e o protótipo mostra no cartão)
- [ ] Regra no core: só uma tarefa `doing` por vez é ligada ao Pomodoro
- [ ] O mapa de progresso precisa de histórico de conclusões por dia, o que depende da decisão de persistência (ver [[✅ Próximos Passos]])

---
Voltar para [[🗳️ Decisões]]
