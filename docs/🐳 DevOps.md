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
4. lint, typecheck e testes;
5. build do web e desktop;
6. build da imagem de produção do `apps/web`.

O workflow não publica a imagem em um registry nem faz deploy. Esses passos
ficam para etapas futuras.

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

- Publicar `tasksorg-web` em um registry.
- Definir deploy automatizado.
- Criar manifests Kubernetes quando o deploy estiver pronto.
- Incorporar backend, banco e health checks quando essas partes forem
  implementadas.
