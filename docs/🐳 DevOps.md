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

Deploys automáticos da Vercel são registrados pelo workflow
`.github/workflows/record-vercel-deployment.yml`, acionado pelo evento
`deployment_status` do GitHub. Ele envia estados concluídos (`success`,
`failure` ou `error`) para `/internal/kpis/deployments`; estados pendentes não
entram na frequência nem na taxa de falha. O workflow usa os secrets
`KPI_API_URL` e `KPI_INGEST_SECRET` do ambiente `production`.

Como reconciliação, `.github/workflows/sync-vercel-deployments.yml` roda
diariamente às 03:15 UTC e também pode ser acionado manualmente. Ele consulta
os deployments Vercel dos últimos 90 dias na API do GitHub e reenvia os estados
concluídos. O endpoint é idempotente para o mesmo deployment, portanto a rotina
não duplica os registros.

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
