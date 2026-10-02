Lista viva — marca como feito conforme avança, e adiciona itens novos conforme surgirem (lembrando do fluxo: pensar → documentar na base de [[🗳️ Decisões]] → desenvolver).

## DevOps

- [ ] Subir o GitLab CE (auto-hospedado) via `docker-compose.yml`, substituindo o serviço `jenkins`
- [ ] Configurar um GitLab Runner com acesso ao Docker do host (padrão DooD, igual o Jenkins tinha)
- [ ] Escrever o `.gitlab-ci.yml` espelhando os stages do antigo `Jenkinsfile` (deps → qualidade → build → build da imagem Docker)
- [ ] Remover `Jenkinsfile` e `devops/jenkins/` do repositório
- [ ] Publicar a imagem `tasksorg-web` num registry (Docker Hub, GHCR ou o próprio GitLab Container Registry)
- [ ] Escrever manifests do Kubernetes (`k8s/deployment.yaml`, `k8s/service.yaml`)
- [ ] Adicionar stage de `kubectl apply` no `.gitlab-ci.yml`

## Produto / Plataformas

- [ ] Criar `apps/mobile` com Expo (React Native), reaproveitando `@tasksorg/core`
- [ ] Persistência real — hoje o `TaskStore` é só em memória. Decidir entre backend próprio (API + Postgres) ou local-first com sync
- [ ] Levantar com o grupo o restante dos requisitos de produto (hoje só tarefas diária/semanal/anual + pomodoro)

## Qualidade / Arquitetura

- [ ] `packages/ui` compartilhado entre web e (futuramente) mobile via React Native Web
- [ ] `packages/eslint-config` compartilhado (hoje `core` e `desktop` têm lint placeholder)

## Documentação

- [x] Estruturar essa página do Notion (Visão Geral, Arquitetura, DevOps, Decisões, Log de Atualizações)
- [ ] Manter o Log de Atualizações em dia a cada sessão de trabalho
