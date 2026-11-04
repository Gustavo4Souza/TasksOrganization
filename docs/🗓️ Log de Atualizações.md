Registro cronológico do que foi feito em cada sessão de trabalho. Pra decisões estruturadas (o porquê das escolhas), ver a base de [[🗳️ Decisões]] — aqui é mais "o que mudou", em ordem de tempo.

## 04/11/2026 — Correções dos checks do PR #51

O teste de autenticação foi isolado da variável `NEXT_PUBLIC_API_URL` usada no
CI, eliminando a espera indevida por uma resposta remota. A API recebeu
`@fastify/rate-limit`: todas as rotas têm limite global de 120 requisições por
minuto e cadastro/login têm limite específico de 10 tentativas por minuto. Um
teste de integração confirma os cabeçalhos e o bloqueio HTTP 429.

O CI passou a instalar explicitamente o Chromium compatível com a versão do
Playwright, sem depender da imagem do runner. Localmente passaram os 25 testes
Web com as variáveis do CI, 10 testes da API com PostgreSQL real e os 32 E2E no
endereço de produção usado pelo workflow (`localhost:3100`).

## 04/11/2026 — Integrações independentes do Higor concluídas

As pendências locais do Higor nos MVPs 1, 2 e 3 foram encerradas. Os aceites do
Quadro, Pomodoro, temas, responsividade e acessibilidade passaram na suíte E2E.
Web e Desktop agora autenticam contra a API; o Electron guarda a sessão com
`safeStorage`. Um repositório local-first persiste a fila de alterações, reenvia
ao reconectar, reconcilia o cache e migra as missões locais no primeiro login.

O dashboard de KPIs foi ligado ao endpoint real e o cenário Playwright percorre
cadastro, migração, reconexão offline e a tela de indicadores contra API e
PostgreSQL. A política CORS foi corrigida para liberar `PUT` e `DELETE` da origem
Web e recebeu teste de integração.

Passaram lint, typecheck, builds, 102 testes do Core, 110 do UI, 25 do Web, 9 da
API com PostgreSQL real, 7 do Desktop, 5 do Mobile e 32 cenários E2E. São 258
testes unitários/de integração, além dos E2E. A cobertura do Core ficou em
97,56% de statements e 91,62% de branches. Permanecem somente tarefas externas:
artefato/tag no GitHub, secrets e relatório CodeQL, cluster Kubernetes, validação
visual Android e release EAS.

## 03/11/2026 — Atividades de Gustavo e Guilhermo executadas por Higor

Higor executou as atividades independentes que estavam atribuídas a Gustavo e
Guilhermo do MVP 2 ao MVP 4. A decisão de persistência foi aceita e virou uma
API Fastify com PostgreSQL, migrations, CRUD de missões, Pomodoro, progresso,
autenticação por sessão, isolamento por usuário e adaptador HTTP no Core. Oito
testes da API passaram contra um PostgreSQL 17 real em container. O backup foi
restaurado em um banco temporário e as três migrations foram conferidas antes
da remoção segura desse banco de auditoria.

A infraestrutura ganhou containers de API/banco, health checks, imagem de
produção, backup automatizado com runbook e coleta de KPIs. Deploys, falhas,
incidentes, pipelines, Lead Time, cobertura, defeitos escapados e testes
instáveis possuem modelo, endpoints e automações; o gate SARIF ganhou três
testes locais. A auditoria não encontrou vulnerabilidades altas ou críticas.

No MVP 4, Higor criou os manifests de Web, API e PostgreSQL, probes e o CD com
`kubectl`, imagens imutáveis e espera de rollout. O mobile recebeu
cadastro/login, sessão no SecureStore, sincronização pelo `TaskRepository` HTTP
e logout com revogação do token. Cinco testes, lint, typecheck e a exportação
Android passaram. O EAS está preparado, mas secrets GitHub/Expo, associação do
projeto, backup real e validação no cluster permanecem pendências externas e
não foram marcadas como concluídas.

## 03/11/2026 — Persistência JSON integrada ao Desktop

A integração pendente de `T1.1.6` foi concluída no Electron. O renderer agora
usa o adaptador `createJsonFileTaskRepository` do Core através de uma ponte IPC
restrita no preload, enquanto o processo principal lê e grava exclusivamente
`userData/tasks.json`. O conteúdo recebido é limitado e validado antes da
escrita.

Para evitar perda de dados, a primeira abertura detecta as missões salvas pela
versão anterior no `localStorage`, grava cada uma no arquivo JSON e só remove a
chave antiga depois que a migração termina com sucesso. Dois testes cobrem a
leitura/escrita pela ponte e a migração, elevando o Desktop a 7 testes. Testes,
lint, typecheck e build passaram.

## 03/11/2026 — Colunas por status no Quadro mobile

A `T4.2.3` foi completada no código com uma segunda navegação por abas no
Mobile: além dos escopos Hoje/Semana/Ano, o usuário alterna entre Missões, Em
batalha e Conquistas. Cada aba mostra seu contador e estado vazio, e as ações do
cartão movem a missão para a coluna correspondente. Ao criar uma missão, o app
retorna à coluna Missões.

Foram adicionados testes para o filtro por coluna. O componente nativo de botão
também foi corrigido para preservar `role="tab"` e o estado selecionado para
leitores de tela. Os 2 testes do Mobile, os 110 testes do UI, lint, typecheck,
build do UI e a exportação Android com 625 módulos passaram. A task permanece
sem o aceite final até a conferência visual em emulador/dispositivo e a revisão
por PR.

## 03/11/2026 — Identidade visual e acessibilidade restauradas no Desktop

A migração do renderer Electron para React no PR #50 removeu as declarações
locais das fontes e parte do comportamento acessível que já existia. O novo
renderer voltou a carregar Silkscreen, Pixelify Sans e Jersey 10 a partir dos
arquivos empacotados. A primeira visita volta a escolher Castelo/Pergaminho por
`prefers-color-scheme`, sem substituir uma escolha salva pelo usuário.

Também foram restaurados o foco visível de teclado e o respeito a
`prefers-reduced-motion`. A chave `lib` duplicada no `tsconfig` do UI foi
removida, eliminando o aviso do empacotador. Build, lint e typecheck do Desktop,
além do typecheck e build do UI, passaram; o Electron iniciou a janela
`TasksOrg — Desktop`. As correções aguardam revisão por PR.

A auditoria completa acrescentou cinco testes automatizados ao Desktop para
tema, relógio da bandeja, estado corrompido e restauração segura da janela. O monitor salvo agora é
usado e posições inválidas são limitadas à área visível. A bandeja passou a usar
o ícone do projeto, mostrar fase/tempo do Pomodoro no tooltip e manter a janela
disponível ao fechá-la. O comando de desenvolvimento deixou de depender de uma
segunda resolução do pnpm. O instalador NSIS e o executável Windows foram gerados
e iniciados localmente com sucesso.

No mobile, `react-dom` foi alinhado ao React 19.3 usado pelo Expo, removendo o
conflito de peer dependency. A documentação de `T1.6.2` foi corrigida de 105 para
92 testes do core, que é a contagem real da suíte com 98,92% de statements.
O `esbuild` direto foi atualizado para uma versão corrigida; a auditoria caiu
para cinco achados moderados transitivos, sem alertas altos ou críticos.

## 03/11/2026 — Integração do desktop com a UI compartilhada

O renderer do Electron foi migrado do HTML manual para React, reutilizando
`@tasksorg/core`, `@tasksorg/ui`, `TaskStore`, persistência local e o mesmo HUD
de Pomodoro, cartões de missão, escopos e temas do web. A janela agora salva
posição, tamanho, monitor e o estado de sempre no topo em `userData`, com uma
ponte preload sem Node exposto ao renderer.

Foi adicionada a bandeja do sistema com ações para abrir, fixar e sair, além da
configuração do `electron-builder` e do workflow `Desktop release`, que gera o
instalador Windows e o publica como artefato. Build, lint, typecheck,
empacotamento local e validação YAML passaram; a execução Windows do workflow
continua pendente para encerrar `T1.5.4`.

## 03/11/2026 — Escopo de produção e preparação da release v0.1.0

O grupo decidiu não criar um ambiente separado de homologação neste MVP.
`T1.6.4` foi retirada do escopo, e a produção do web continua sendo atendida
pela integração existente com a Vercel. A `T1.6.5` foi validada parcialmente:
o `CHANGELOG.md` foi preparado, mas a tag `v0.1.0` deve ser criada somente após
o merge desta documentação na `main`.

## 03/11/2026 — CI do MVP 1 e publicação no GHCR

A `T1.6.2` foi concluída no workflow de CI: além dos testes unitários, o pipeline
executa a cobertura do `@tasksorg/core` com limiar de 90%, os testes E2E e publica
um resumo tabular de sucesso/falha no Summary do GitHub Actions. A validação local
passou com 92 testes do core, 98,92% de statements e 31 cenários E2E; lint,
typecheck e builds Web/Desktop também passaram.

A `T1.6.3` foi concluída: pushes na `main` fazem login no GHCR com o
`GITHUB_TOKEN` e publicam `ghcr.io/<owner>/tasksorg-web` com tags de SHA e
`latest`. Pull requests continuam apenas construindo a imagem, sem publicar.

O catálogo e o contrato de dados de KPIs já existentes foram reconhecidos como
`T3.2.8`. As tarefas de renderer/tray do Electron, ambiente de homologação e
KPIs dependentes de deploy ou incidentes reais continuam abertas.

## 03/11/2026 — Quadro mobile e testes de aceite do Higor

O pacote `@tasksorg/ui/native` foi ligado ao app Expo e compatibilizado com as
versões de React do Web e do mobile. O app ganhou alternância entre os temas
Castelo e Pergaminho, abas Hoje/Semana/Ano, criação e ciclo completo das missões,
além do Pomodoro integrado à missão em batalha. A exportação Android pelo Expo,
os testes, lint e typecheck do mobile/UI e os builds de UI/Web passaram. A
conferência visual em emulador ou dispositivo continua como critério de aceite.

Foi adicionada uma suíte E2E específica para os critérios do Higor: atalhos,
arrastar e soltar, alternativa por teclado, persistência do tema, layouts em
monitor vertical/celular e avisos de fase. Toda a suíte E2E passou localmente:
31 cenários, incluindo os seis novos critérios do Higor.
O servidor de testes agora pode reutilizar uma instância local, mantendo uma
inicialização isolada no CI. Com isso, não resta implementação independente do
Higor; as demais tasks aguardam API, autenticação, cluster ou revisão do time.

A `T3.1.6` também foi encerrada: as correções de segurança já estavam integradas
pelo PR #40, e os checks públicos do commit atual da `main` (`cb86f34`) confirmam
CodeQL, auditoria de dependências e build concluídos com sucesso.

## 02/11/2026 — Testes de aceite do MVP 1 e tarefas liberadas

Entraram os testes E2E (`T1.6.1`, PR #43), a auditoria axe (`T1.4.4`, PR #44) e o limite de cobertura do core (`T1.1.7`, PR #45). O Roadmap agora lista o que cada integrante pode puxar. A proposta de persistência (`T2.1.1`, PR #46) e a base do mobile (`T4.2.1`, PR #47) estão em revisão.

## 02/11/2026 — Documentação alinhada ao estado da `main`

Roadmap, Arquitetura e Próximos Passos alinhados a `1502ae6`: CI, CodeQL e auditoria
passando na `main`, Next.js 15 e Electron 42. Localmente, lint, typecheck, build e os
223 testes (92 core, 108 UI, 23 Web) passaram. As caixas de `T3.1.2` e `T3.1.3`
continuam abertas até o relatório e o bloqueio serem conferidos.

## 02/11/2026 — Compatibilidade do lockfile com o CI

O PR falhou na instalação congelada porque o lockfile e os overrides foram
gerados para pnpm 11, mas os workflows usam pnpm 9.12.0. Os overrides passaram
a constar também na configuração lida pelo pnpm 9 e o lockfile foi regenerado
com essa versão. A instalação congelada, a auditoria no limite alto/crítico,
lint, typecheck e os 223 testes passaram com pnpm 9. A nova execução remota
de CI, auditoria e Vercel ainda precisa confirmar os checks.

## 02/11/2026 — Correção local dos checks de segurança do PR #37

Removido o upload SARIF duplicado do workflow CodeQL, preservando a análise e
o Security Gate. Vitest foi atualizado de 2.1.9 para 4.1.12 em Web, core e UI;
as dependências transitivas de alta severidade foram resolvidas por overrides
compatíveis no workspace. A auditoria local agora passa em `--audit-level=high`
(restam três achados moderados na auditoria com pnpm 9). Também foi atualizado o mock de `AudioContext`
e a configuração do Vitest para compatibilidade com a nova versão.

Validação local: 23 testes Web, 92 do core e 108 do UI; lint, typecheck e builds
Web/Desktop concluídos. O aceite das tasks de segurança continua pendente da
nova execução remota do CodeQL após o envio da branch.

## 02/11/2026 — Validações de segurança e dependências Web/Desktop

As `T1.2.1`–`T1.2.4` foram alinhadas no roadmap ao PR #21: a implementação já
está na `main`, enquanto o aceite E2E do MVP 1 continua pendente (`T1.6.1`).

O PR #21 integrou o trabalho anterior do Higor e o PR #22 trouxe CodeQL e a
auditoria de dependências. O roadmap foi atualizado para os três integrantes com
base no código e nas execuções: o CodeQL ainda falha pelo envio duplicado de SARIF,
e a auditoria executa mas encontra dependências vulneráveis.

Na branch `Higor`, Next e eslint-config-next foram atualizados para 15.5.28 e
Electron para 42.11.16. Passaram 23 testes do Web, lint, typecheck e builds do
Web/Desktop. A auditoria passou de 7 críticas/37 altas para 3 críticas/9 altas.
Os alertas restantes incluem ferramentas de testes compartilhadas e dependências
transitivas; não foram marcados como resolvidos. A atualização de dependências
precisa de revisão pelo time antes de entrar na `main`.

## 31/10/2026 — SAST e auditoria de dependências do MVP 3

Concluídas as `T3.1.1`, `T3.1.2`, `T3.1.3` e `T3.1.4`. O CodeQL foi escolhido
como SAST principal e configurado em `.github/workflows/codeql.yml` para analisar
JavaScript/TypeScript com `security-extended` em pushes, pull requests e execução
semanal. Os resultados são publicados no GitHub Code Scanning e o workflow bloqueia
o pipeline quando encontra vulnerabilidades com `security-severity` alta ou crítica.

Criado `.github/workflows/dependency-audit.yml`, que executa
`pnpm audit --audit-level=high` no CI. Também foi configurado o Dependabot em
`.github/dependabot.yml` para propor atualizações semanais das dependências npm e
das GitHub Actions. Os arquivos de configuração foram validados como YAML; a
auditoria local ficou pendente porque `pnpm` não estava disponível no ambiente.

## 30/10/2026 — Quadro e Modo foco do MVP 1

Complementada a validação do Quadro com 14 missões de exemplo nos temas Castelo e
Pergaminho em 1280×720. Isso revelou títulos de cartões ocultos pela grade CSS;
o layout dos cartões foi corrigido e as capturas refeitas, sem rolagem da página.
A restauração do tema salvo também foi corrigida e recebeu teste. Os avisos de
troca de fase, com som 8-bit opcional e notificação mediante permissão, agora
compartilham a mesma implementação entre Quadro e Modo foco. Passaram 13 testes
do Web e 34 do UI, além de lint, typecheck e build do Web e build do Desktop. A revisão
por PR e os critérios finais da Definition of Done ainda estão pendentes; as
alterações desta sessão permanecem locais na branch `Higor`.

Foram acrescentados testes de edição, exclusão com confirmação e botões de
movimentação como alternativa ao arrastar. Links e resumos da lista excedente
receberam foco de teclado visível. No Modo foco, os atalhos agora respeitam as
teclas modificadoras e não interceptam a digitação em controles. A primeira visita
direta ao Modo foco agora respeita o tema claro do sistema; a exibição das próximas
três missões recebeu teste. O Mapa recebeu descrições acessíveis de cada dia e mês,
com teste para as sete posições semanais e os doze meses.

O Modo foco foi conferido em Chrome com missões preenchidas nos temas Castelo e
Pergaminho em 1280×720 e no celular em 390×844. Mesmo com títulos longos, relógio,
controles e próximas três missões permaneceram visíveis. Um teste adicional
verifica que Espaço inicia/pausa o relógio sem capturar a tecla em controles nem
com `Ctrl` pressionado.

A imagem Docker de produção do Web foi construída com o código local da branch
`Higor`. O contêiner iniciou e respondeu HTTP 200 nas rotas `/`, `/foco` e
`/design`; foi encerrado após a verificação. Resta a revisão por outro integrante
em PR para concluir formalmente as tasks do MVP 1.

Após o merge do PR #17, o Quadro passou a usar `PomodoroHUD` e `RoomMap` de
`@tasksorg/ui`, concluindo a integração da `T1.3.2` e centralizando o mapa da
`T1.2.7`. A exportação pública desses componentes foi corrigida em
`components.ts`; sem ela, o Web não conseguia importá-los pelo pacote. A suíte
de componentes também teve oito expectativas ajustadas às classes atuais do
Design System. Passaram 15 testes do Web e 105 do UI, além de lint, typecheck e
build do Web.

Uma conferência task a task confirmou que as entregas do Higor no MVP 0 já foram
integradas à `main`; a página `MVP0-Higor.md` foi corrigida para refletir isso.
No MVP 1, a movimentação real por arrastar e soltar ganhou teste, elevando a
suíte do Web a 14 testes. A `T1.3.2` foi separada das implementações prontas: a
lateral atual funciona, mas a integração final depende do componente
`PomodoroHUD` da `T0.2.9` (Gustavo), ainda ausente de `@tasksorg/ui`.

Adicionado teste de integração do Quadro para criar, iniciar batalha, concluir e
restaurar uma missão do armazenamento local. Corrigida a restauração do Pomodoro
para creditar o foco concluído mesmo quando as missões ainda estão carregando.
Ampliados os testes para lista excedente, troca de escopo, persistência e primeira
visita no tema claro. O Quadro foi conferido em Chrome nas dimensões 1280×720,
1440×900 e 1920×1080: as capturas completas têm exatamente essas alturas, sem
rolagem da página. O monitor vertical (1080×1920) recebeu grade 2×2; no celular
(390×844), a rolagem continua permitida. Essas verificações cobrem estados vazios;
os testes E2E completos seguem com a task de qualidade do MVP 1.

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
