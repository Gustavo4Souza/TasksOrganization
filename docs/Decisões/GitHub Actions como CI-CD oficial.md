**Categoria:** DevOps · **Status:** Aceita · **Data:** 2026-10-11

## Contexto

O projeto chegou a documentar e implementar pipelines com Jenkins e, depois,
planejou uma migração para GitLab CI/CD. Essas alternativas adicionavam
infraestrutura própria ao repositório, embora o projeto já esteja hospedado no
GitHub.

## O que foi decidido

Adotar **GitHub Actions** como a única solução oficial de CI/CD do TasksOrg.
O workflow em `.github/workflows/ci.yml` valida o monorepo em cada push e pull
request, executando instalação de dependências, lint, typecheck, testes, build
do web e desktop e build da imagem de produção do `apps/web`.

O Docker continua sendo usado para:

- desenvolvimento local do `apps/web` via `docker-compose.yml` e bind mount;
- build da imagem de produção do web via `apps/web/Dockerfile`;
- execução futura dos serviços de backend e banco, quando essas fases forem
  implementadas.

Jenkins e GitLab ficam somente como histórico de decisões substituídas. Seus
arquivos e serviços foram removidos do projeto para evitar configurações de
CI/CD concorrentes.

## Consequências / Próximos passos

- O CI não depende de Jenkins, GitLab CE, Runner próprio ou Docker socket
  montado no host.
- A publicação da imagem em um registry e o deploy permanecem etapas futuras.
- Backend, banco, migrations, variáveis de ambiente e health checks serão
  incorporados na fase correspondente ao backend/persistência.

---
Voltar para [[🗳️ Decisões]]
