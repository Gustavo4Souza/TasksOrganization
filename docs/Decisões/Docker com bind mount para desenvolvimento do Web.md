**Categoria:** DevOps · **Status:** Aceita · **Data:** 2026-08-21

## Contexto

Time decidiu adotar Docker + Jenkins como ferramental de DevOps (Kubernetes entra depois).

## O que foi decidido

`apps/web` tem duas imagens: `Dockerfile.dev` (usada com bind mount via `docker-compose.yml`, pra hot-reload em desenvolvimento) e `Dockerfile` de produção (build multi-stage: deps → builder → runner).

## Consequências / Próximos passos

Editar código no host reflete direto no container, sem rebuild. Volumes anônimos protegem o `node_modules` do container (Linux) de ser sobrescrito pelo do host (Windows).

---
Voltar para [[🗳️ Decisões]]
