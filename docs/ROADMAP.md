# 🚀 TasksOrg — Roadmap do Projeto

> Gerenciador de tarefas multiplataforma com estética **pixel art / Metroidvania**, feito para ficar **aberto num monitor secundário**, desenvolvido com foco em **DevOps, DevSecOps, CI/CD, testes automatizados e monitoramento de KPIs**.

---

## 📌 Visão Geral

O **TasksOrg** é um aplicativo de organização pessoal com:

- 📋 Tarefas ("missões") com status, prioridade e escopo diário, semanal ou anual
- 🍅 Timer Pomodoro ligado à tarefa em andamento
- 🗺️ Mapa de progresso da semana e do ano
- 🖥️ Tela única, **sem rolagem**, pensada para o segundo monitor
- 🌐 Web, 🖥️ Desktop e 📱 Mobile (futuro), com a mesma regra de negócio
- 🐳 Docker, ⚙️ CI/CD, 🧪 testes, 🔒 SAST, 📈 KPIs de DevOps, ☸️ Kubernetes (futuro)

```text
PLAN → CODE → BUILD → TEST → RELEASE → DEPLOY → OPERATE → MONITOR
```

### 🎨 Referências de design

| O quê | Onde |
|---|---|
| Design System (tokens, fontes, componentes `px-*`) | [Design System TasksOrg](https://claude.ai/artifact/1CWD4ogZnHRhc5SyxuQnJe) |
| Telas prototipadas (Quadro, Modo foco, Pergaminho, Ano, Vertical) | [TasksOrg — Telas Pixel](https://claude.ai/artifact/Bk4WBV9v1PWYYX4mW4MdUS) |
| Decisão registrada | [`docs/Decisões/Identidade visual pixel (Metroidvania) e tela sem rolagem.md`](docs/Decisões/Identidade%20visual%20pixel%20(Metroidvania)%20e%20tela%20sem%20rolagem.md) |

---

## 👥 Equipe

| Integrante | Área principal | Responsabilidades |
|---|---|---|
| 👨‍💻 Higor | Produto + Frontend | Telas, componentes React, UX, acessibilidade, integração com a API |
| 👨‍💻 Gustavo | Backend + Qualidade | `@tasksorg/core`, API, banco, tokens do Design System, testes |
| 👨‍💻 Guilhermo | DevOps + DevSecOps | Repositório, CI/CD, Docker, Electron build, SAST, deploy, KPIs |

> Cada task tem **um único responsável** (quem entrega). Todo PR passa pela revisão de pelo menos um dos outros dois.

---

## 🧭 Como este roadmap está organizado

```text
MVP ──► entrega que dá para demonstrar e usar
 └─ Épico ──► bloco grande de valor (vira uma milestone/label no GitHub)
     └─ Task ──► 1 responsável, cabe em até 2 dias (vira uma issue)
```

- **ID da task:** `T<mvp>.<épico>.<nº>` — ex.: `T1.2.4` = MVP 1, Épico 2, Task 4. Use o ID no nome da branch e do PR: `feat/T1.2.4-densidade-adaptativa`.
- **Tamanho:** `P` (até meio dia) · `M` (1 dia) · `G` (2 dias — se passar disso, quebre em duas).
- **Dependência:** `⛓ T0.2.1` = só começa depois dessa.
- **Board:** `Backlog → A fazer → Em andamento → Em revisão → Concluído` (o mesmo fluxo que o app ensina: Missões → Em batalha → Conquistas).

---

## ✅ Já conquistado (POC)

- [x] Monorepo com pnpm workspaces + Turborepo
- [x] `@tasksorg/core` com `Task`, `TaskStore` e `PomodoroTimer` (13 testes com Vitest)
- [x] `apps/web` (Next.js 14) e `apps/desktop` (Electron 32) consumindo o core
- [x] Docker com bind mount para desenvolvimento do web + Dockerfile de produção
- [x] GitHub Actions como CI/CD oficial
- [x] Jenkins removido da configuração ativa
- [x] `apps/web` definido como frontend oficial
- [x] Roadmap consolidado em `docs/`
- [x] Base de Decisões (ADR) no cofre e em `docs/`
- [x] Identidade visual: Design System pixel/Metroidvania (paleta Castelo/Pergaminho, fontes, 8 componentes)
- [x] Protótipo interativo das telas (Quadro, Modo foco, tema claro, escopo Ano, monitor vertical)

---

## 🗺️ Roadmap

### Estado das entregas do Higor — 30/10/2026

| Status | Tasks | Situação |
|---|---|---|
| Concluídas e integradas à `main` | `T0.1.4`, `T0.2.4`–`T0.2.8`, `T0.2.11` | Web oficial, fontes, componentes pixel e catálogo `/design` integrados pelos PRs #14 e #16. |
| Implementadas na branch `Higor`, aguardando validação e revisão | `T1.2.1`–`T1.2.7`, `T1.3.2`–`T1.3.5`, `T1.4.1`–`T1.4.3` | Quadro e Modo foco com tarefas salvas localmente, Pomodoro, mapa, ações, densidade, arrastar e soltar, atalhos, temas e layouts responsivos. Build do Web e Desktop e teste do fluxo criar → batalhar → concluir → recarregar passaram; faltam validação nas resoluções alvo, cobertura complementar e PR. |

Validação atual da UI: lint e typecheck aprovados e 34 testes passaram. Veja
[escopo e validação do MVP 0](MVP0-Higor.md).

### Estado das entregas do Gustavo — 23/10/2026

| Status | Tasks | Situação |
|---|---|---|
| Concluídas | `T0.1.7` | `packages/eslint-config` (ESLint 9) e `packages/tsconfig` compartilhados; core e desktop com lint de verdade. O core não pode usar `window` nem `process`: o typecheck barra. Mergeado no PR #5. |
| Concluídas | `T1.1.1`, `T1.1.2`, `T1.1.3`, `T1.1.6` | `pomodoros` e `completedAt` no `Task`, uma única missão em batalha (`startBattle`), `update` e ordenação por prioridade, `TaskRepository` com adaptadores localStorage e arquivo JSON. Mergeado no PR #5. |
| Concluídas | `T0.2.2`, `T0.2.3` | `tokens.css` gerado do `tokens.json` do Design System (temas Castelo e Pergaminho) e teste de contraste WCAG nos dois temas, rodando no CI. Mergeado no PR #9. |
| Concluídas | `T1.1.4`, `T1.1.5` | `PomodoroTimer.onPhaseChange` e `creditFocusToBattle` (fim do Foco credita +1 na missão em batalha); `weekProgress` e `yearProgress` com níveis 0–3 para o mapa. Core com 68 testes. Mergeado no PR #10. |
| Concluídas | `T1.3.1`, `T1.3.6` | Hooks `usePomodoro` e `usePomodoroSettings` em `@tasksorg/ui/hooks`: relógio pelo tempo real (aba em segundo plano continua certa), retoma ao recarregar descontando só até o fim da fase, `skip` sem crédito e tempos validados e salvos localmente. Mergeados no PR #12; liberam `T1.3.2`–`T1.3.4` (Higor) e `T1.5.3` (Guilhermo). |
| Correção integrada | — | `output: "standalone"` do Next só no build do Docker (`NEXT_OUTPUT=standalone`). Correção integrada no PR #15. |
| Prontas para começar | `T1.1.7`, `T2.1.1` | Cobertura ≥ 90% no core; proposta da decisão de persistência para o grupo. |
| Liberadas para implementação/validação | `T0.2.9`, `T0.2.10`, `T1.6.1` | Os componentes do MVP 0 estão na `main`; a tela `T1.2.5` está implementada na branch `Higor` e precisa de revisão para liberar os E2E. |

> As tasks só passam para concluídas depois da revisão por PR e dos demais critérios da Definition of Done.

| MVP | Nome | O que dá para demonstrar no fim | Sprints |
|---|---|---|---|
| 🟦 **MVP 0** | Fundação | Página `/design` com todos os componentes pixel nos dois temas, CI verde | 1–2 |
| 🟩 **MVP 1** | Quadro no segundo monitor | O protótipo funcionando de verdade no web e no desktop, salvando localmente | 3–5 |
| 🟨 **MVP 2** | Conta e sincronização | Login, dados no Postgres, web e desktop sincronizados | 6–7 |
| 🟥 **MVP 3** | DevSecOps e KPIs | SAST bloqueando PR, tela de KPIs de DevOps no estilo pixel | 8–9 |
| 🟪 **MVP 4** | Evolução | Deploy no Kubernetes e app mobile | 10+ |

---

### 🟦 MVP 0 — Fundação

**🎯 Objetivo:** deixar o repositório pronto para construir as telas: um único app web, CI rodando e o Design System virando código reutilizável.

**🏁 Entrega:** rota `/design` no `apps/web` mostrando todos os componentes `px-*` nos temas Castelo e Pergaminho, com o CI passando no PR.

#### Épico 0.1 — Repositório limpo e CI básico

> Como time, queremos um repositório sem duplicidades e com CI confiável, para que todo PR seja validado automaticamente.

- [x] `T0.1.1` Registrar a decisão "GitHub Actions de volta como CI/CD" no cofre e em `docs/Decisões/` — **Guilhermo** · P
- [x] `T0.1.2` Remover `Jenkinsfile`, `devops/jenkins/` e o serviço `jenkins` do `docker-compose.yml` — **Guilhermo** · P · ⛓ T0.1.1
- [x] `T0.1.3` Remover arquivos soltos da raiz (`teste.js`, `Claude outputs/`) — **Guilhermo** · P
- [x] `T0.1.4` Decidir entre `frontend/` e `apps/web` (hoje existem dois apps Next.js), migrar o que for útil e apagar o outro; registrar a decisão — **Higor** · M
- [x] `T0.1.5` Revisar `.github/workflows/ci.yml`: install → lint → typecheck → test → build, com cache do pnpm — **Guilhermo** · M · ⛓ T0.1.4
- [x] `T0.1.6` Proteger a `main`: merge só por PR, com 1 aprovação e CI verde — **Guilhermo** · P · ⛓ T0.1.5
- [x] `T0.1.7` Criar `packages/eslint-config` e `packages/tsconfig` compartilhados e trocar os lints placeholder de `core` e `desktop` — **Gustavo** · M

#### Épico 0.2 — Design System no código (`packages/ui`)

> Como dev, quero importar tokens e componentes pixel de um único pacote, para que web e desktop fiquem idênticos ao protótipo.

- [x] `T0.2.1` Criar `packages/ui` no workspace (build, export de CSS e de componentes, tarefas no `turbo.json`) — **Guilhermo** · M
- [x] `T0.2.2` Gerar `tokens.css` dos temas Castelo e Pergaminho a partir do `tokens.json` do Design System (script versionado) — **Gustavo** · M · ⛓ T0.2.1
- [x] `T0.2.3` Teste automatizado de contraste: falha se algum par texto/fundo dos tokens ficar abaixo de 4.5:1 — **Gustavo** · P · ⛓ T0.2.2
- [x] `T0.2.4` Portar as classes `px-*` do `bundle.css` do Design System para `packages/ui/styles` — **Higor** · P · ⛓ T0.2.2
- [x] `T0.2.5` Fontes Silkscreen, Pixelify Sans e Jersey 10 (via `next/font` no web e arquivos locais no Electron) — **Higor** · P · integrada à `main`
- [x] `T0.2.6` Componentes React `Panel`, `Button`, `Tag` e `PixelIcon` (caveira, coração, espada, estrela, check, bandeira) — **Higor** · M · ⛓ T0.2.4
- [x] `T0.2.7` Componentes React `TaskCard` (normal, em batalha, conquistada, compacto) e `StatBar` — **Higor** · M · ⛓ T0.2.6
- [x] `T0.2.8` Componente React `ScopeTabs` (com `role="tablist"` e contadores) — **Higor** · P · ⛓ T0.2.6
- [ ] `T0.2.9` Componentes React `PomodoroHUD` e `RoomMap`, recebendo o `PomodoroSnapshot` do core como prop — **Gustavo** · M · ⛓ T0.2.6
- [ ] `T0.2.10` Testes de componentes (Vitest + Testing Library): estados, props e acessibilidade básica — **Gustavo** · M · ⛓ T0.2.7
- [x] `T0.2.11` Rota `/design` no `apps/web` com o catálogo de componentes e alternância de tema — **Higor** · P · ⛓ T0.2.7

**✔️ Critérios de aceite do MVP 0**
- Componentes iguais aos previews do Design System nos dois temas.
- Nenhuma cor em hex fora de `tokens.css`.
- CI rodando lint, typecheck, testes e build em todo PR.

---

### 🟩 MVP 1 — Quadro no segundo monitor

**🎯 Objetivo:** transformar o protótipo em um app usável no dia a dia, ainda **sem login**: os dados ficam salvos no navegador (web) ou em arquivo (desktop).

**🏁 Entrega:** telas Quadro e Modo foco funcionando no web e no Electron, com Pomodoro, temas e layouts do protótipo. Release `v0.1.0`.

#### Épico 1.1 — Core: regras novas que as telas precisam

> Como usuário, quero que o Pomodoro conte para a missão em que estou trabalhando e que meu progresso fique registrado.

- [x] `T1.1.1` Adicionar `pomodoros` (focos gastos) e `completedAt` ao `Task` — **Gustavo** · P
- [x] `T1.1.2` Regra "só uma missão em batalha": `TaskStore.startBattle(id)` devolve a anterior para `todo` — **Gustavo** · M
- [x] `T1.1.3` `TaskStore.update` (título, prioridade, escopo, prazo) e ordenação por prioridade — **Gustavo** · P
- [x] `T1.1.4` `PomodoroTimer` emite evento de troca de fase; ao fim de um Foco, credita +1 à missão em batalha — **Gustavo** · M · ⛓ T1.1.2
- [x] `T1.1.5` Histórico diário de conclusões, com nível de 0 a 3 por dia e por mês (alimenta o `RoomMap`) — **Gustavo** · M · ⛓ T1.1.1
- [x] `T1.1.6` Interface `TaskRepository` + adaptadores `localStorage` (web) e arquivo JSON (desktop) — **Gustavo** · M
- [ ] `T1.1.7` Testes unitários das regras acima (meta: ≥ 90% de cobertura no core) — **Gustavo** · M

#### Épico 1.2 — Tela Quadro

> Como usuário, quero ver todas as missões do escopo de relance, sem rolar a tela, e mudá-las de coluna com um clique.

- [ ] `T1.2.1` Layout em `100vh`: HUD + 3 colunas + lateral (grid do protótipo) — **Higor** · M · ⛓ T0.2.11
- [ ] `T1.2.2` HUD: `ScopeTabs` com contadores, barra de XP do dia e campo "Nova missão" com prioridade — **Higor** · M · ⛓ T1.2.1
- [ ] `T1.2.3` Colunas Missões / Em batalha / Conquistas, com estados vazios — **Higor** · M · ⛓ T1.2.1
- [ ] `T1.2.4` Densidade adaptativa: mais de 6 cartões → compactos; mais de 11 → "+N missões" com lista em popover — **Higor** · M · ⛓ T1.2.3
- [ ] `T1.2.5` Ações no cartão: concluir, BATALHAR/RECUAR, editar inline e excluir com confirmação — **Higor** · M · ⛓ T1.1.3
- [ ] `T1.2.6` Arrastar e soltar entre colunas, com alternativa por teclado — **Higor** · G · ⛓ T1.2.5
- [ ] `T1.2.7` Painel Mapa ligado ao histórico do core — **Higor** · P · ⛓ T1.1.5

#### Épico 1.3 — Pomodoro e Modo foco

> Como usuário, quero um timer que eu leia de longe e que me avise quando a fase virar.

- [x] `T1.3.1` Hook `usePomodoro` (tick com `PomodoroTimer`, continua certo após recarregar a página) — **Gustavo** · M · ⛓ T1.1.4
- [ ] `T1.3.2` `PomodoroHUD` na lateral, ligado à missão em batalha — **Higor** · P · ⛓ T1.3.1
- [ ] `T1.3.3` Tela Modo foco (`/foco`): relógio gigante, missão atual e próximas 3 — **Higor** · M · ⛓ T1.3.1
- [ ] `T1.3.4` Aviso de troca de fase: notificação do sistema + som 8-bit opcional — **Higor** · M · ⛓ T1.3.1
- [ ] `T1.3.5` Atalhos de teclado: `Espaço` (iniciar/pausar), `N` (nova missão), `1`/`2`/`3` (escopo), `F` (modo foco) — **Higor** · P · implementados na branch `Higor`, aguardando testes e revisão
- [x] `T1.3.6` Configuração dos tempos (padrão 25/5/15, 4 ciclos), salva localmente — **Gustavo** · P

#### Épico 1.4 — Temas, formatos de tela e acessibilidade

> Como usuário, quero que o app funcione no meu monitor, seja ele pequeno, grande ou vertical, no tema que eu preferir.

- [ ] `T1.4.1` Alternância Castelo/Pergaminho salva, respeitando `prefers-color-scheme` na primeira visita — **Higor** · P · Web e Desktop integrados aos tokens de `@tasksorg/ui`; aguarda validação final e revisão
- [ ] `T1.4.2` Layouts para telas de até 1280px, monitor vertical e celular (no celular a rolagem é aceita) — **Higor** · M · ⛓ T1.2.1
- [ ] `T1.4.3` `prefers-reduced-motion`, foco de teclado visível e `aria-label` nos botões de ícone — **Higor** · P · base de movimento/foco no Web e Desktop pronta; rótulos dos futuros botões de ícone pendentes
- [ ] `T1.4.4` Auditoria automática com axe nas telas (zero violações sérias) — **Gustavo** · M

#### Épico 1.5 — Desktop com a mesma interface

> Como usuário, quero o TasksOrg como janela própria no segundo monitor, sem depender de uma aba do navegador.

- [ ] `T1.5.1` Renderer do Electron usando `packages/ui` e as mesmas telas do web — **Guilhermo** · M · ⛓ T1.2.1
- [ ] `T1.5.2` Opção "sempre no topo" e lembrar posição, tamanho e monitor da janela — **Guilhermo** · M · ⛓ T1.5.1
- [ ] `T1.5.3` Ícone na bandeja do sistema mostrando o tempo do Pomodoro — **Guilhermo** · M · ⛓ T1.3.1
- [ ] `T1.5.4` Gerar instalador Windows (electron-builder) no CI como artefato — **Guilhermo** · M · ⛓ T1.5.1

#### Épico 1.6 — Qualidade e entrega do MVP 1

> Como time, queremos garantir que o fluxo principal nunca quebre e que cada merge gere uma versão testável.

- [ ] `T1.6.1` Testes E2E (Playwright): criar → batalhar → concluir; troca de fase do Pomodoro; tela sem rolagem em 1280×720, 1440×900 e 1920×1080 — **Gustavo** · G · ⛓ T1.2.5
- [ ] `T1.6.2` Rodar unitários e E2E no CI, com relatório de sucesso/falha (base do KPI de testes) — **Guilhermo** · M · ⛓ T1.6.1
- [ ] `T1.6.3` Publicar a imagem `tasksorg-web` no GHCR a cada merge na `main` — **Guilhermo** · M
- [ ] `T1.6.4` Ambiente de homologação do web, com deploy automático — **Guilhermo** · M · ⛓ T1.6.3
- [ ] `T1.6.5` Release `v0.1.0` com changelog e tag — **Guilhermo** · P · ⛓ T1.6.4

**✔️ Critérios de aceite do MVP 1**
- Nenhuma barra de rolagem na tela Quadro em 1280×720, 1440×900 e 1920×1080.
- O Pomodoro credita o foco na missão em batalha, e o mapa reflete as conclusões do dia.
- Web e desktop com o mesmo comportamento, garantido pelo core compartilhado.
- Dados sobrevivem a recarregar a página e a reabrir o app.

---

### 🟨 MVP 2 — Conta e sincronização

**🎯 Objetivo:** substituir o armazenamento local por persistência real, com login, e sincronizar web e desktop.

**🏁 Entrega:** usuário cria conta, faz login no web e no desktop e vê as mesmas missões nos dois.

```text
Web / Desktop ──► TaskRepository (HTTP) ──► API ──► PostgreSQL
```

#### Épico 2.1 — API e banco de dados

> Como usuário, quero minhas missões salvas na nuvem para não perdê-las e acessá-las de qualquer lugar.

- [ ] `T2.1.1` Registrar a decisão de persistência (API + Postgres ou local-first com sync), pendente desde a POC — **Gustavo** · P
- [ ] `T2.1.2` Estruturar `apps/api` reutilizando `@tasksorg/core` — **Gustavo** · M · ⛓ T2.1.1
- [ ] `T2.1.3` Modelagem e migrations: `users`, `tasks`, `pomodoro_sessions`, `daily_progress` — **Gustavo** · M · ⛓ T2.1.2
- [ ] `T2.1.4` CRUD de tarefas com validação — **Gustavo** · M · ⛓ T2.1.3
- [ ] `T2.1.5` Sessões de Pomodoro e histórico diário (alimentam o mapa) — **Gustavo** · M · ⛓ T2.1.4
- [ ] `T2.1.6` Autenticação e autorização (cada usuário só vê as próprias missões) — **Gustavo** · G · ⛓ T2.1.3
- [ ] `T2.1.7` Adaptador `TaskRepository` HTTP no core (troca o local sem mudar as telas) — **Gustavo** · M · ⛓ T2.1.4
- [ ] `T2.1.8` Testes de API e de integração com banco real em container — **Gustavo** · M · ⛓ T2.1.4

#### Épico 2.2 — Frontend integrado

> Como usuário, quero entrar na minha conta e continuar de onde parei, mesmo se a internet cair.

- [ ] `T2.2.1` Prototipar no canvas as telas de login e cadastro com o Design System — **Higor** · P
- [ ] `T2.2.2` Implementar login e cadastro no estilo pixel — **Higor** · M · ⛓ T2.2.1, T2.1.6
- [ ] `T2.2.3` Estados de carregamento e erro pixelados (blocos piscando em `steps()`, aviso de erro) — **Higor** · M
- [ ] `T2.2.4` Modo offline: fila local de alterações, sincronizada ao reconectar — **Higor** · G · ⛓ T2.1.7
- [ ] `T2.2.5` Migrar os dados locais do MVP 1 para a conta no primeiro login — **Higor** · M · ⛓ T2.2.2

#### Épico 2.3 — Infraestrutura dos dados

> Como time, queremos ambientes reproduzíveis e monitorados para API e banco.

- [ ] `T2.3.1` Containers `api` e `postgres` no `docker-compose.yml`, com volumes — **Guilhermo** · M · ⛓ T2.1.2
- [ ] `T2.3.2` `.env.example` e secrets no GitHub — **Guilhermo** · P
- [ ] `T2.3.3` Endpoints `/health` e `/ready`, usados pelo Docker e pelo deploy — **Guilhermo** · P · ⛓ T2.1.2
- [ ] `T2.3.4` Ambientes dev, homologação e produção — **Guilhermo** · M
- [ ] `T2.3.5` Backup automático do banco — **Guilhermo** · P · ⛓ T2.3.4

---

### 🟥 MVP 3 — DevSecOps e KPIs

**🎯 Objetivo:** adicionar segurança ao pipeline e medir o processo de entrega.

**🏁 Entrega:** PR com vulnerabilidade grave é bloqueado; tela de KPIs de DevOps no estilo pixel dentro do TasksOrg.

```text
Git Push ──► GitHub Actions ──► SAST ──► Security Gate ──┬─► OK ────► Build
                                                         └─► Falha ─► Bloqueio
```

#### Épico 3.1 — SAST e Security Gate

> Como time, queremos que vulnerabilidades sejam encontradas antes do deploy.

- [ ] `T3.1.1` Escolher a ferramenta SAST e registrar a decisão — **Guilhermo** · P
- [ ] `T3.1.2` SAST no GitHub Actions com relatório no PR — **Guilhermo** · M · ⛓ T3.1.1
- [ ] `T3.1.3` Security Gate: bloquear PR com severidade alta ou crítica — **Guilhermo** · P · ⛓ T3.1.2
- [ ] `T3.1.4` Auditoria de dependências (`pnpm audit` / Dependabot) — **Guilhermo** · P
- [ ] `T3.1.5` Corrigir achados no core e na API — **Gustavo** · M · ⛓ T3.1.2
- [ ] `T3.1.6` Corrigir achados no web/desktop e validar entradas do usuário — **Higor** · M · ⛓ T3.1.2

#### Épico 3.2 — Coleta dos KPIs

> Como time, queremos números reais sobre frequência de deploy, falhas, recuperação e testes.

- [ ] `T3.2.1` Registrar cada deploy (data/hora, versão, ambiente) — **Guilhermo** · M
- [ ] `T3.2.2` Definir o que conta como falha e registrar falhas, rollbacks e hotfixes — **Guilhermo** · M
- [ ] `T3.2.3` Registrar incidentes (início, identificação, correção, recuperação) para o MTTR — **Guilhermo** · M
- [ ] `T3.2.4` Enviar o resultado dos testes do CI (aprovados/falhos) para a base de KPIs — **Guilhermo** · P · ⛓ T1.6.2
- [ ] `T3.2.5` Modelo de dados e endpoints dos KPIs, com os cálculos validados por testes — **Gustavo** · M · ⛓ T2.1.2
- [ ] `T3.2.6` Registrar Lead Time, sucesso e duração dos pipelines — **Guilhermo** · M · ⛓ T1.6.2
- [ ] `T3.2.7` Registrar cobertura, defeitos escapados e testes instáveis — **Gustavo** · M · ⛓ T1.6.2
- [ ] `T3.2.8` Registrar o catálogo completo de KPIs e o contrato de dados — **Guilhermo** · P

> Fórmulas, fontes, dependências, periodicidade e contrato de dados estão no
> [catálogo de KPIs](KPIs%20de%20DevOps%20e%20DevSecOps.md).

#### Épico 3.3 — Tela de KPIs de DevOps

> Como time, queremos ver os KPIs dentro do próprio TasksOrg, no mesmo visual.

- [ ] `T3.3.1` Prototipar no canvas a tela de KPIs com o Design System (`StatBar` para taxas, `RoomMap` como calendário de deploys) — **Higor** · M
- [ ] `T3.3.2` Implementar os cards de Deployments, Taxa de falha, MTTR e Testes — **Higor** · M · ⛓ T3.3.1, T3.2.5
- [ ] `T3.3.3` Histórico e filtro por período — **Higor** · M · ⛓ T3.3.2

---

### 🟪 MVP 4 — Evolução

**🎯 Objetivo:** levar o TasksOrg para orquestração em Kubernetes e para o celular.

#### Épico 4.1 — Kubernetes

```text
k8s/
├── deployment.yaml
├── service.yaml
├── configmap.yaml
└── secret.yaml
```

- [ ] `T4.1.1` Manifests de web, api e banco (`deployment`, `service`, `configmap`, `secret`) — **Guilhermo** · G
- [ ] `T4.1.2` Health checks via `/health` e `/ready` — **Guilhermo** · P · ⛓ T2.3.3
- [ ] `T4.1.3` Stage `kubectl apply` no CD — **Guilhermo** · M · ⛓ T4.1.1
- [ ] `T4.1.4` Validar API e banco no cluster — **Gustavo** · P · ⛓ T4.1.3
- [ ] `T4.1.5` Validar frontend e acesso no cluster — **Higor** · P · ⛓ T4.1.3

#### Épico 4.2 — Mobile (Expo)

- [ ] `T4.2.1` Criar `apps/mobile` com Expo, consumindo `@tasksorg/core` — **Gustavo** · M
- [ ] `T4.2.2` Adaptar `packages/ui` para React Native (tokens + componentes principais) — **Higor** · G
- [ ] `T4.2.3` Tela Quadro mobile (uma coluna por aba) e Pomodoro — **Higor** · G · ⛓ T4.2.2
- [ ] `T4.2.4` Login e sincronização no mobile — **Gustavo** · M · ⛓ T4.2.1
- [ ] `T4.2.5` Build e release mobile no CI (EAS) — **Guilhermo** · M · ⛓ T4.2.1

---

## 📅 Cronograma de Sprints

Sprints de 2 semanas.

| Sprint | MVP | Épicos | Meta da sprint |
|---|---|---|---|
| 1 | MVP 0 | 0.1, 0.2 (início) | Repositório limpo, CI rodando, `packages/ui` criado com tokens |
| 2 | MVP 0 | 0.2 | Componentes prontos e rota `/design` no ar |
| 3 | MVP 1 | 1.1, 1.2 | Regras novas no core e tela Quadro montada |
| 4 | MVP 1 | 1.2, 1.3, 1.4 | Pomodoro integrado, Modo foco, temas e layouts |
| 5 | MVP 1 | 1.5, 1.6 | Desktop com a nova UI, E2E e release `v0.1.0` |
| 6 | MVP 2 | 2.1, 2.3 | API, banco e containers |
| 7 | MVP 2 | 2.1, 2.2 | Login, sincronização e modo offline |
| 8 | MVP 3 | 3.1, 3.2 | SAST, Security Gate e coleta dos KPIs |
| 9 | MVP 3 | 3.3 | Tela de KPIs de DevOps |
| 10 | MVP 4 | 4.1 | Kubernetes, documentação e apresentação |
| 11+ | MVP 4 | 4.2 | Mobile |

## ⚖️ Carga por pessoa

| MVP | Higor | Gustavo | Guilhermo |
|---|---|---|---|
| MVP 0 | 7 tasks · ~5 dias | 5 tasks · ~4.5 dias | 6 tasks · ~4 dias |
| MVP 1 | 14 tasks · ~12.5 dias | 11 tasks · ~10.5 dias | 8 tasks · ~7.5 dias |
| MVP 2 | 5 tasks · ~5.5 dias | 8 tasks · ~8.5 dias | 5 tasks · ~3.5 dias |
| MVP 3 | 4 tasks · ~4 dias | 2 tasks · ~2 dias | 8 tasks · ~6 dias |
| MVP 4 | 3 tasks · ~4.5 dias | 3 tasks · ~2.5 dias | 4 tasks · ~4.5 dias |
| **Total** | **33 tasks · ~31.5 dias** | **29 tasks · ~28 dias** | **31 tasks · ~25.5 dias** |

> Estimativa pelo tamanho das tasks (P = ½ dia, M = 1 dia, G = 2 dias). Se alguém ficar livre na sprint, puxa a próxima task sem dependência pendente, mesmo de outra área, e o dono da área revisa.

---

## 🏗️ Arquitetura

```text
        Web App            Desktop             Mobile (MVP 4)
        Next.js            Electron            Expo
           │                  │                   │
           └─────────┬────────┴─────────┬─────────┘
                     ↓                  ↓
              packages/ui        @tasksorg/core
         (Design System pixel)   (Task, Pomodoro, TaskRepository)
                                        │
                                        ↓
                                apps/api (MVP 2)
                                        │
                                        ↓
                                   PostgreSQL
```

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Monorepo | pnpm Workspaces + Turborepo |
| Web | Vercel + Next.js 14 + React 18 |
| Desktop | Electron 32 |
| Mobile | Expo / React Native — MVP 4 |
| Regras de negócio | `@tasksorg/core` |
| Interface | `packages/ui` (Design System pixel) — MVP 0 |
| API + banco | Render + `apps/api` + Neon PostgreSQL — MVP 2 |
| Testes | Vitest, Testing Library, Playwright, axe |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Segurança | SAST + Security Gate — MVP 3 |
| Orquestração | Kubernetes — MVP 4 |

---

## 📊 KPIs do Projeto

| KPI | Fórmula | Fonte | Responsável | Task |
|---|---|---|---|---|
| 🚀 Frequência de implantação | Deploys / período | CI/CD | Guilhermo | `T3.2.1` |
| ⏱️ Lead Time for Changes | Deploy concluído - primeiro commit | Git + CI/CD | Guilhermo + Gustavo | `T3.2.6` |
| ⚠️ Taxa de falha de alterações | Deploys com falha / total × 100 | CI/CD + incidentes | Guilhermo + Gustavo | `T3.2.2` |
| 🔄 MTTR | Tempo detecção→recuperação / incidentes | Incidentes | Guilhermo | `T3.2.3` |
| ✅ Taxa de sucesso do pipeline | Workflows aprovados / executados × 100 | GitHub Actions | Guilhermo + Gustavo | `T3.2.6` |
| ⏲️ Duração do pipeline | Fim - início, total e por etapa | GitHub Actions | Guilhermo | `T3.2.6` |
| 🧪 Taxa de sucesso dos testes | Testes aprovados / executados × 100 | Vitest + CI | Gustavo + Guilhermo | `T3.2.4` |
| 📈 Cobertura de testes | Código coberto / executável × 100 | Coverage | Gustavo + Guilhermo | `T3.2.7` |
| 🐛 Taxa de defeitos escapados | Defeitos após CI / alterações entregues | Issues + incidentes | Gustavo + Higor | `T3.2.7` |
| 🔁 Taxa de rollback/hotfix | Deploys com correção / total × 100 | Deploy + incidentes | Guilhermo | `T3.2.2` |
| 🎲 Taxa de testes instáveis | Execuções instáveis / totais × 100 | GitHub Actions | Gustavo + Guilhermo | `T3.2.7` |
| 🔐 SAST | Vulnerabilidades por severidade | SAST | Guilhermo | `T3.1.2` |
| 🛡️ Correção de vulnerabilidades | Correção - identificação | SAST/SCA + issues | Guilhermo + responsável técnico | Catálogo |
| 📦 Vulnerabilidades de dependências | Contagem por severidade | SCA/pnpm audit | Guilhermo | `T3.1.4` |
| 🔑 Secret scanning | Segredos expostos | Secret scanning | Guilhermo | Catálogo |
| 🟢 Disponibilidade | Tempo disponível / observado × 100 | Monitoramento | Guilhermo | MVP futuro |
| ⚠️ Taxa de erro | Erros / requisições × 100 | Logs/APM | Guilhermo + Gustavo | MVP futuro |
| ⚡ Latência P50/P95/P99 | Percentis de resposta | APM/web/API | Guilhermo | MVP futuro |
| 🎯 Operações críticas | Operações sucesso / total × 100 | API + frontend | Gustavo + Higor | MVP futuro |

---

## 📥 Definition of Ready

Uma task só entra em **A fazer** quando:

- [ ] Tem ID, responsável e tamanho (`P`, `M` ou `G`)
- [ ] As dependências (`⛓`) estão concluídas
- [ ] Se é de tela: existe protótipo no canvas usando o Design System
- [ ] Se muda uma regra ou a arquitetura: a decisão está registrada em `docs/Decisões/`

## 📋 Definition of Done

Uma task só vai para **Concluído** quando:

- [ ] Código revisado e aprovado em PR por outro integrante
- [ ] Testes implementados e passando
- [ ] Lint e typecheck passando
- [ ] SAST sem bloqueios (a partir do MVP 3)
- [ ] Build e imagem Docker funcionando
- [ ] Se é de tela: usa só tokens do Design System, foi conferida nos temas Castelo e Pergaminho e não cria rolagem na tela Quadro
- [ ] Documentação e Log de Atualizações atualizados

---

## 🛡️ Pipeline Final

```text
DEVELOPER ─► Git / PR ─► GitHub Actions
                              │
     Install ─► Lint ─► Typecheck ─► Tests ─► SAST ─► Build ─► Docker Image
                                                                    │
                     KPIs ◄─ MONITOR ◄─ OPERATE ◄─ DEPLOY ◄─ RELEASE
                       │
                       ↓
              Tela de KPIs no TasksOrg
```

> **Regra do projeto:** pensar → documentar → desenvolver. Cada integrante tem uma área principal, mas toda entrega passa por revisão e integração dos demais.
