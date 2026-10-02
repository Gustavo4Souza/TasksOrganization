**Categoria:** DevOps · **Status:** Substituída · **Data:** 2026-08-21

## Contexto

Time definiu Jenkins como ferramenta de CI/CD do projeto (em vez de GitHub Actions).

## O que foi decidido

`Jenkinsfile` na raiz substitui o antigo `.github/workflows/ci.yml` (removido). Jenkins roda em container próprio (`devops/jenkins/Dockerfile`, com Docker CLI instalado) e usa o socket do Docker do host via bind mount ("Docker outside of Docker") pra buildar imagens e subir containers efêmeros `node:20` como agentes de build.

## Consequências / Próximos passos

Pipeline: instalar deps → qualidade (lint/typecheck/test) → build (web+desktop) → build da imagem Docker do web. Testado localmente na máquina do Gustavo em 22/08 (resolvido conflito de porta com Jenkins nativo já instalado). **SUBSTITUÍDO** pelo GitLab CI/CD (auto-hospedado) em 13/09/2026 — ver [[GitLab CE (auto-hospedado) substituindo o Jenkins]].

---
Voltar para [[🗳️ Decisões]]
