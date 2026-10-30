Registro cronológico do que foi feito em cada sessão de trabalho. Pra decisões estruturadas (o porquê das escolhas), ver a base de [[🗳️ Decisões]] — aqui é mais "o que mudou", em ordem de tempo.

## 30/10/2026 — Quadro e Modo foco do MVP 1

Na branch `Higor`, a POC do Web foi substituída pelo Quadro com HUD, três colunas,
ações de missão, densidade adaptativa, lista de excedentes, arrastar e soltar,
Pomodoro e Mapa. As missões usam `TaskStore` e `TaskRepository` no armazenamento
local. A rota `/foco` mostra relógio grande, missão atual e próximas três, com
som e notificação opcionais. Os atalhos incluem `F` para alternar o Modo foco.
O Desktop passou a carregar os tokens compartilhados e alternar os temas com
preferência persistida. Build do Web, build e lint do Desktop passaram; a
validação visual foi feita nos dois temas em viewport estreita. Ainda faltam
testes de interface, validação nas resoluções de monitor do roadmap e revisão
por PR antes de fechar as tasks.

## 23/10/2026 — Componentes pixel e catálogo do MVP 0

Na branch `Higor`, foram implementados Panel, Button, Tag, PixelIcon, TaskCard,
StatBar e ScopeTabs em `@tasksorg/ui`, com estados, contadores, foco e navegação
por teclado. A nova rota `/design` mostra os componentes nos temas Castelo e
Pergaminho e permite experimentar as ações. As fontes locais existentes foram
preservadas e os estilos usam os tokens compartilhados. O
`components/bundle.css` foi conferido e portado para alinhar molduras, sombras,
botões, tags, cartões, barras e abas à referência. A revisão por PR permanece
pendente. Detalhes em [MVP0-Higor](MVP0-Higor.md).

## 23/10/2026 — Tokens do Design System e regras do Pomodoro no core

Concluídas a `T0.2.2` e a `T0.2.3` (PR #9): o `packages/ui` guarda o `tokens.json`
do Design System e gera `styles/tokens.css` com os temas Castelo e Pergaminho,
sombras, medidas, fontes e classes `.px-type-*`. O arquivo gerado fica commitado e
o build falha se ele divergir do JSON. Um teste confere o contraste WCAG de texto,
bordas e foco nos dois temas e roda no CI.

Concluídas a `T1.1.4` e a `T1.1.5` (PR #10): o `PomodoroTimer` avisa cada troca de
fase e `creditFocusToBattle` credita +1 pomodoro na missão em batalha quando um Foco
termina. `weekProgress` e `yearProgress` calculam os níveis 0 a 3 do mapa a partir
das conclusões, no fuso local. O core passou de 45 para 68 testes.

Com isso ficam liberadas a `T0.2.4` e a `T1.2.5` (Higor) e a `T1.3.1` (Gustavo).

Feitas a `T1.3.1` e a `T1.3.6` (PR aberto): o core passou a salvar e retomar o
Pomodoro (ao recarregar, desconta o tempo fechado só até o fim da fase em que parou,
então um app fechado por horas credita 1 Foco, não vários), ganhou `skip()` (Foco
pulado não credita) e valida os tempos (Foco de 1 a 120 min, pausas, de 1 a 12 ciclos). O
`@tasksorg/ui/hooks` traz `usePomodoro` e `usePomodoroSettings`: o relógio segue o
tempo real, então a aba em segundo plano no monitor secundário continua certa;
funcionam no SSR do Next e não creditam em dobro no StrictMode. Core com 92 testes,
`packages/ui` com 25.

Encontrada a causa do `next` sumindo do `node_modules` no Windows (PR aberto): o
`output: "standalone"` cria em `.next/standalone` links simbólicos para os pacotes
reais do pnpm, e o build seguinte, ao apagar o `.next` antigo, esvaziava esses
pacotes. O standalone agora só é ligado no build do Docker (`NEXT_OUTPUT=standalone`).
Deve explicar também o `EPERM` registrado em 20/10.

Corrigida no roadmap a dependência da `T2.1.8` (testes de API), que passa a
depender da `T2.1.4`.

## 22/10/2026 — Integração dos temas Web aos tokens compartilhados

Avançada a `T1.4.1` do Higor: o Web passa a importar `@tasksorg/ui/tokens.css`,
removendo as paletas duplicadas. O tema é aplicado ao documento inteiro, inclusive
ao fundo e ao texto, com os identificadores `castelo`/`pergaminho` do pacote.
A preferência salva anteriormente continua válida; armazenamento indisponível
não impede a troca de tema durante a sessão. Botões usam `--on-accent` e o foco
usa `--focus-ring`. Integração Desktop e validação visual permanecem pendentes.

## 21/10/2026 — Lint compartilhado e regras novas do core

Concluída a `T0.1.7`: criados `packages/eslint-config` (ESLint 9 + typescript-eslint,
presets `base`, `node` e `browser`) e `packages/tsconfig` (presets `base`, `library`,
`node` e `nextjs`), substituindo o `tsconfig.base.json` da raiz. Core e desktop
trocaram o lint placeholder por ESLint de verdade. O preset do core não inclui DOM
nem tipos do Node, então usar `window` ou `process` no core quebra o typecheck.

Adiantadas do MVP 1 as `T1.1.1`, `T1.1.2`, `T1.1.3` e `T1.1.6` no `@tasksorg/core`:
`pomodoros` e `completedAt` no `Task`, regra de uma única missão em batalha para o
app inteiro (`startBattle` devolve a anterior para "todo"), `TaskStore.update` e
ordenação por prioridade, e a interface `TaskRepository` com adaptadores para
localStorage (web) e arquivo JSON (desktop). O core passou de 13 para 45 testes.
Tudo revisado e mergeado no PR #5.

## 21/10/2026 — Fundação do pacote compartilhado de UI

Implementada a `T0.2.1`: criado o pacote `@tasksorg/ui` no workspace, com build
TypeScript, declarações de tipo e exports públicos para componentes e CSS.
Também foram configurados lint, typecheck, integração com pnpm/Turborepo e a
geração de `dist/styles.css` a partir da entrada `styles/index.css`.

O pacote está pronto para receber os tokens dos temas Castelo e Pergaminho,
as classes `px-*` e os componentes React nas próximas tasks do épico 0.2.
O build, lint e typecheck do pacote passaram localmente.

## 20/10/2026 — Fontes do Design System no Web e Desktop

Implementada localmente a `T0.2.5`: Silkscreen para títulos e botões, Pixelify Sans
para texto e Jersey 10 para o relógio. O Web carrega arquivos locais por `next/font`
e o Electron usa `@font-face`; as licenças OFL acompanham as duas cópias dos arquivos.
Typecheck e lint do Web passaram; o Desktop compilou e empacotou. O build Web
compilou e gerou páginas, mas a etapa `standalone` falhou no Windows por falta de
permissão para criar symlinks (`EPERM`). A revisão por outro integrante ainda falta.

Iniciada também a `T1.4.3`: o Web e o Desktop agora exibem foco de teclado,
respeitam `prefers-reduced-motion` e têm rótulos associados aos campos das
formas atuais. Os botões existentes têm texto; os futuros botões só com ícone
precisarão de `aria-label` quando forem criados.

Na `T1.3.5`, o Web passou a aceitar Espaço para iniciar/pausar o Pomodoro,
`N` para focar a nova tarefa e `1`/`2`/`3` para trocar o escopo, sem capturar
teclas enquanto o usuário digita num campo. O atalho `F` aguarda a rota `/foco`.

A `T1.4.1` está funcional no Web: o usuário pode alternar entre Castelo e
Pergaminho, a escolha fica salva no navegador e a primeira visita respeita a
preferência de cor do sistema. A versão compartilhada dos tokens e a aplicação
no Desktop dependem de `packages/ui`.

## 11/10/2026 — GitHub Actions e consolidação do Docker

Definido o `apps/web` como frontend oficial, com `docker-compose.yml` para
desenvolvimento e `apps/web/Dockerfile` para produção. Criado o workflow
`.github/workflows/ci.yml` para lint, typecheck, testes, builds e imagem Docker.
Jenkins foi removido do projeto, GitLab não será implementado e a antiga pasta
`frontend/` foi removida. Backend, banco, health checks e deploy permanecem para
as fases futuras.

## 13/09/2026 — Troca do Jenkins pelo GitLab + equipe formalizada

Duas atualizações do grupo: (1) equipe formalizada na página Visão Geral — Gustavo, Guilhermo e Higor; (2) decidido trocar o **Jenkins** pelo **GitLab CI/CD auto-hospedado** (GitLab CE em Docker, não o GitLab.com na nuvem). Por enquanto é só documentação (decisão registrada, seção "GitLab CI/CD" adicionada na página DevOps) — a implementação no código (subir GitLab CE, Runner, `.gitlab-ci.yml`, remover Jenkins) fica pro próximo passo. Seguindo o fluxo pensar → documentar → desenvolver.

## 02/09/2026 — Início da documentação no Notion

Criada a estrutura de documentação (esta página + subpáginas + base de Decisões), trazendo pra cá tudo que já tinha sido decidido nas sessões anteriores. Daqui pra frente, novas definições entram primeiro aqui, antes de virar código.

## 22/08/2026 — Jenkins rodando localmente

Resolvido conflito de porta entre o Jenkins containerizado (docker-compose) e um Jenkins nativo já instalado na máquina do Gustavo, que estava ocupando a porta 7000 como serviço do Windows. Serviço nativo parado (`Stop-Service`), Jenkins do container acessível em `http://localhost:7000`.

## 21/08/2026 — Docker + Jenkins

Adicionado ao projeto: `docker-compose.yml` (bind mount pro app web + Jenkins), `Dockerfile` de produção multi-stage pro web, imagem custom do Jenkins com Docker CLI, e `Jenkinsfile` substituindo o `.github/workflows/ci.yml` (removido). Não foi possível testar o build das imagens no ambiente onde a POC foi montada (sem acesso ao Docker Hub) — validado depois na máquina do Gustavo.

## 21/08/2026 — POC inicial

Monorepo criado do zero: pnpm workspaces + Turborepo, `packages/core` (tarefas + pomodoro, com testes Vitest), `apps/web` (Next.js) e `apps/desktop` (Electron), ambos consumindo a mesma lógica compartilhada. Pipeline de CI inicial no GitHub Actions (depois substituído pelo Jenkins). Tudo validado rodando de verdade: testes passando, build de produção do web servindo página real, Electron subindo sem erro.
