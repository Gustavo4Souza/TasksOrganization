**Categoria:** DevOps · **Status:** Proposta · **Data:** 2026-08-21

## Contexto

Time definiu Docker + GitHub Actions, com Kubernetes planejado pra uma próxima
fase, para orquestrar o deploy das imagens geradas pelo pipeline.

## O que foi decidido

Ainda não implementado. A ideia é escrever manifests
(`k8s/deployment.yaml`, `k8s/service.yaml`) para a imagem `tasksorg-web` e
adicionar uma etapa de deploy ao workflow do GitHub Actions.

## Consequências / Próximos passos

Depende de: (1) validar Docker e GitHub Actions de ponta a ponta, (2) publicar
a imagem num registry (hoje o workflow só builda local, não dá push).

---
Voltar para [[🗳️ Decisões]]
