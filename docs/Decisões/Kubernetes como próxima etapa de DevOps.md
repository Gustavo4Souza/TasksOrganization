**Categoria:** DevOps · **Status:** Proposta · **Data:** 2026-08-21

## Contexto

Time definiu Docker + Jenkins agora, com Kubernetes planejado pra uma próxima fase, pra orquestrar o deploy das imagens geradas pelo pipeline.

## O que foi decidido

Ainda não implementado. Ideia: escrever manifests (`k8s/deployment.yaml`, `k8s/service.yaml`) pra imagem `tasksorg-web` e adicionar um stage `kubectl apply` no fim do Jenkinsfile.

## Consequências / Próximos passos

Depende de: (1) validar Docker+Jenkins de ponta a ponta, (2) publicar a imagem num registry (hoje o Jenkins só builda local, não dá push).

---
Voltar para [[🗳️ Decisões]]
