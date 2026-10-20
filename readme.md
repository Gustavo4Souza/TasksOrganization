# TasksOrg — POC

POC de um app de organização de tarefas (diárias, semanais, anuais) com timer
Pomodoro, inspirado no Notion. Objetivo desta etapa: validar a arquitetura
multiplataforma (web, desktop e, no futuro, mobile) e deixar o pipeline de
DevOps (CI) já configurado desde o início do projeto.

## Stack

- **Monorepo**: pnpm workspaces + [Turborepo](https://turbo.build/) para orquestrar build/lint/test/typecheck entre os pacotes, com cache incremental.
- **Linguagem**: TypeScript em 100% do código.
- **Web**: [Next.js](https://nextjs.org/) 14 (App Router) + React 18.
- **Desktop**: [Electron](https://www.electronjs.org/) 32, reaproveitando a mesma lógica de negócio.
- **Lógica compartilhada**: pacote `@tasksorg/core`, sem nenhuma dependência de UI — é usado tanto pela web quanto pelo desktop.
- **Testes**: [Vitest](https://vitest.dev/) no pacote `core`.
- **Containers**: [Docker](https://www.docker.com/) + Docker Compose — o app web roda em container tanto em desenvolvimento (com bind mount) quanto em produção (imagem multi-stage).
- **CI/CD**: [GitHub Actions](https://github.com/features/actions) (`.github/workflows/ci.yml`). Kubernetes entra numa próxima etapa, para orquestrar o deploy dessas imagens.

Tudo em JavaScript/TypeScript, como decidido pelo grupo — isso permite
compartilhar lógica, tipos e (no futuro) até componentes de UI entre as
plataformas.

## Estrutura do monorepo

```
TasksOrganization/
├── apps/
│   ├── web/        → Next.js (roda no navegador)
│   │   ├── Dockerfile      → imagem de PRODUÇÃO (multi-stage)
│   │   └── Dockerfile.dev  → imagem de DESENVOLVIMENTO (usada com bind mount)
│   └── desktop/     → Electron (empacota a web/lógica num app nativo)
├── packages/
│   └── core/         → Regras de negócio compartilhadas (tasks + pomodoro)
├── docker-compose.yml → sobe o app web em desenvolvimento (bind mount)
├── .github/workflows/ → pipeline de CI/CD com GitHub Actions
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Por que um monorepo?

Porque o core do projeto é rodar em várias plataformas com o mesmo
comportamento. Colocar tudo em um único repositório com pacotes compartilhados
evita duplicar regra de negócio (tipos de tarefa, lógica do pomodoro, etc.) em
cada plataforma — e o Turborepo garante que só se rebuilda o que mudou.

### `packages/core`

Contém, sem nenhuma dependência de React/DOM/Electron:

- `task.ts` — modelo de `Task` (escopo diário/semanal/anual, status, prioridade) e um `TaskStore` em memória.
- `pomodoro.ts` — uma máquina de estados `PomodoroTimer` (foco → pausa curta → pausa longa), agnóstica de como o tempo é avançado (quem consome chama `tick()`).

Isso é o que a Web e o Desktop importam e usam da mesma forma — é a prova de
conceito de que dá pra compartilhar lógica de verdade entre as plataformas.

## Como rodar

Pré-requisitos: Node 20+ e pnpm (`corepack enable` já resolve).

```bash
pnpm install

# roda tudo (lint, typecheck, test, build) em todos os pacotes
pnpm build
pnpm test
pnpm lint
pnpm typecheck

# desenvolvimento
pnpm --filter @tasksorg/web dev       # Next.js em http://localhost:3000
pnpm --filter @tasksorg/desktop dev   # builda e abre a janela do Electron
```

## O que já foi validado nesta POC

- `packages/core` com 13 testes unitários passando (tarefas + pomodoro).
- `apps/web` builda em modo produção (`next build`) e serve a página de
  verdade (testado localmente com `next start`).
- `apps/desktop` compila (`tsc` + bundle do renderer com `esbuild`) e a
  janela do Electron sobe sem erros de JS (validado em modo headless com
  Xvfb, que é como muitos CIs testam Electron; no Windows/macOS de vocês
  vai abrir normalmente com interface gráfica).
- Lint, typecheck, test e build passam localmente com os mesmos comandos que
  o pipeline de CI usa.
- `docker-compose.yml` tem sintaxe validada (`docker compose config`).
- **Docker/Jenkins ainda não foram testados de ponta a ponta** — o ambiente
  onde essa POC foi montada bloqueia acesso ao Docker Hub, então não deu pra
  buildar as imagens nem subir os containers por aqui. O primeiro teste real
  disso precisa ser feito na sua máquina (ou de algum colega). Veja a seção
  "Docker" abaixo com o passo a passo — e me chama se algo quebrar.

## Docker

O app **web** roda em container de duas formas diferentes:

### Desenvolvimento (com bind mount)

`apps/web/Dockerfile.dev` + `docker-compose.yml` fazem um **bind mount** da
pasta do projeto pra dentro do container: você edita o código no VSCode,
normalmente, e o container "enxerga" a mudança na hora — sem rebuildar nada.

```bash
docker compose up -d --build web
# acompanhar os logs (fica esperando compilar na primeira vez):
docker compose logs -f web
```

Depois abra `http://localhost:3000`. Pra parar: `docker compose down`.

Repare no `docker-compose.yml`: o bind mount é a linha `.:/app` (pasta do
host mapeada pro `/app` do container). As linhas logo abaixo dela
(`/app/node_modules`, etc.) são **volumes anônimos** — eles existem só pra
proteger o `node_modules` de dentro do container (compilado pra Linux) de
ser sobrescrito pelo `node_modules` do seu Windows, que teria binários
incompatíveis.

### Produção (imagem final, sem bind mount)

`apps/web/Dockerfile` faz um build multi-stage (deps → builder → runner) e
gera uma imagem enxuta e autossuficiente — essa é a imagem que o GitHub Actions
constrói no pipeline:

```bash
docker build -f apps/web/Dockerfile -t tasksorg-web .
docker run -p 3000:3000 tasksorg-web
```

## GitHub Actions

O workflow `.github/workflows/ci.yml` instala as dependências, executa lint,
typecheck e testes, builda web e desktop e constrói a imagem Docker de produção
do web. O desktop é validado no CI, mas não gera uma imagem Docker.

O catálogo de KPIs e o contrato de dados para futuras coletas estão em
[docs/KPIs de DevOps e DevSecOps.md](<docs/KPIs de DevOps e DevSecOps.md>).

## Próximos passos sugeridos

- **Testar Docker e GitHub Actions de ponta a ponta** — o Compose é voltado ao
  desenvolvimento local; o workflow é executado no GitHub.
- **Kubernetes**: depois que o fluxo Docker + GitHub Actions estiver validado, o
  passo natural é escrever manifests (`k8s/deployment.yaml`, `k8s/service.yaml`)
  pra imagem `tasksorg-web` e adicionar um stage `kubectl apply` no final do
  workflow. Pra desenvolvimento local de k8s, dá pra usar Docker Desktop
  (tem Kubernetes embutido) ou k3d/kind.
- **Mobile**: adicionar `apps/mobile` com [Expo](https://expo.dev/) (React
  Native), reaproveitando `@tasksorg/core`. Isso fecha o tripé
  web/desktop/mobile.
- **Persistência real**: hoje `TaskStore` é só em memória. Próximo passo
  natural é um backend (ex. API em Fastify/Next API routes + Postgres) ou
  sincronização local-first (ex. IndexedDB/SQLite + sync).
- **Registry de imagens**: hoje o GitHub Actions builda a imagem localmente
  (`docker build`) mas não publica em nenhum lugar. Pra Kubernetes puxar
  essa imagem de verdade, ela precisa ir pra um registry (Docker Hub, GHCR,
  etc.) — um stage `docker push` depois do `docker build`.
- **Design system compartilhado**: extrair um `packages/ui` com componentes
  visuais reaproveitáveis entre web e (futuramente) mobile via React Native
  Web, para chegar mais perto da experiência do Notion.
- **Lint compartilhado**: hoje `core` e `desktop` têm lint placeholder;
  vale configurar um `packages/eslint-config` compartilhado.
- **Requisitos do produto**: esta POC cobre só tarefas (diária/semanal/anual)
  + pomodoro, o suficiente para validar a arquitetura. Os demais requisitos
  do time (que ainda serão detalhados) entram como novas features dentro
  dessa mesma estrutura.
