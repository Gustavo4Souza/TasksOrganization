Ferramentas definidas pelo grupo: **Docker** para desenvolvimento e imagens,
**GitHub Actions** para CI/CD e **Kubernetes** numa próxima etapa. O frontend
oficial é `apps/web`; backend e banco serão incorporados posteriormente.

## Docker

O app web roda em container de duas formas.

### Desenvolvimento

`apps/web/Dockerfile.dev` e `docker-compose.yml` montam o projeto do host em
`/app`. Isso permite editar no VS Code e usar hot reload sem rebuildar a
imagem a cada alteração.

```bash
docker compose up -d --build web
docker compose logs -f web
```

O web fica disponível em `http://localhost:3000`. Os volumes anônimos protegem
os `node_modules` e o `.next` do container contra o bind mount do host, e o
volume `pnpm-store` mantém o cache entre reinicializações.

### Produção

`apps/web/Dockerfile` faz um build multi-stage (`deps`, `builder` e `runner`)
usando o output standalone do Next.js. A imagem final roda como usuário
não-root e não usa bind mount.

```bash
docker build -f apps/web/Dockerfile -t tasksorg-web .
docker run -p 3000:3000 tasksorg-web
```

O desktop Electron não é containerizado. Backend, banco, migrations,
variáveis de ambiente e health checks serão adicionados na fase de backend e
persistência.

## GitHub Actions

O workflow oficial está em `.github/workflows/ci.yml` e roda em todo push e
pull request. Ele executa:

1. checkout do repositório;
2. configuração do pnpm 9.12.0 e Node.js 20;
3. instalação com `pnpm install --frozen-lockfile`;
4. lint, typecheck, testes unitários, cobertura do core e E2E;
5. build do web e desktop;
6. build da imagem de produção do `apps/web`;
7. publicação da imagem no GHCR em pushes na `main`, usando o `GITHUB_TOKEN`.

O `pnpm-lock.yaml` deve permanecer válido e sem chaves duplicadas, pois tanto o
CI quanto a auditoria executam `pnpm install --frozen-lockfile`. O build do
Web compila `packages/core` antes do Next.js para que o deploy, inclusive na
Vercel, use os exports atuais do pacote compartilhado.

Os deploys de produção da Vercel entram nos KPIs pela rotina
`.github/workflows/sync-vercel-deployments.yml`, que roda diariamente às 03:15
UTC e também pode ser acionada manualmente (Actions → Sync Vercel deployments →
Run workflow). A Vercel não cria "deployments" no GitHub neste repositório: ela
publica um status "Vercel – <projeto>" em cada commit. A rotina lê esses status
nos commits que entraram direto no `main` (`git log --first-parent`, últimos 90
dias), do `pending` ao status final, e envia para `/internal/kpis/deployments`.
Projetos pulados ("Skipped - Not affected") e deploys cancelados ficam de fora.
O endpoint é idempotente, portanto a rotina não duplica os registros. Ela usa
os secrets de repositório `KPI_API_URL` e `KPI_INGEST_SECRET`.

O deploy de produção do web continua sendo gerenciado pela integração existente
com a Vercel. Não haverá ambiente separado de homologação neste MVP.

O catálogo completo de métricas, IDs canônicos, fórmulas, fontes, responsáveis
e contrato de dados está em [KPIs de DevOps e DevSecOps](./KPIs%20de%20DevOps%20e%20DevSecOps.md).
Esse catálogo deve ser consultado antes de coletar, calcular ou interpretar
qualquer KPI.

## Histórico de CI/CD

Jenkins e GitLab CE foram avaliados anteriormente, mas não são mais
configurações ativas. O `Jenkinsfile`, a imagem customizada e o serviço Jenkins
foram removidos para evitar pipelines concorrentes. As decisões substituídas
continuam registradas em `docs/Decisões/`.

## Próximas etapas de DevOps

- Executar o workflow `Desktop release` manualmente (`workflow_dispatch`) e
  validar o instalador Windows gerado como artefato (`T1.5.4`).
- Criar a tag `v0.1.0`; ela dispara o mesmo workflow e publica a release (`T1.6.5`).
- Definir o cluster e validar os manifests de `k8s/` (`T4.1.4`–`T4.1.5`).
- Em produção, a API precisa de `TRUST_PROXY=1` atrás do Render ou do Ingress (PR #53).
- Incorporar backend, banco e health checks quando essas partes forem
  implementadas.

## API na Vercel

A API roda como função da Vercel, em um projeto separado do site:

- **Projeto `tasksorg-api`**: raiz `apps/api`. A entrada é `apps/api/api/index.ts`, que sobe o mesmo app Fastify do `server.ts` e aplica as migrações na primeira requisição de cada instância. O `apps/api/vercel.json` manda todos os caminhos para essa função.
  - Variáveis: `DATABASE_URL` (Postgres Neon, use a URL com *pooling*), `KPI_INGEST_SECRET`, `ALLOWED_ORIGINS` (domínio do site), `TRUST_PROXY=true` e `NODE_ENV=production`.
- **Projeto `tasks-organization`** (site): o `next.config.mjs` repassa `/api/*` para a API quando `API_ORIGIN` está definida.
  - Variáveis: `NEXT_PUBLIC_API_URL=/api` e `API_ORIGIN=<endereço do projeto tasksorg-api>`.
  - Para o navegador, site e API ficam no mesmo domínio, então o cookie de sessão é de primeira parte.
- **Secrets do GitHub**: `KPI_API_URL` (endereço da API) e `KPI_INGEST_SECRET` (o mesmo valor da API), usados pelo CI e pelos workflows de coleta de KPIs.
