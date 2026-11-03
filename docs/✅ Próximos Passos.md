Lista viva — marca como feito conforme avança, e adiciona itens novos conforme surgirem (lembrando do fluxo: pensar → documentar na base de [[🗳️ Decisões]] → desenvolver).

## DevOps

- [x] Adotar GitHub Actions como CI/CD oficial
- [x] Remover Jenkins e GitLab da configuração ativa do projeto
- [x] Criar workflow de CI com qualidade, build e imagem Docker do web
- [ ] Publicar a imagem `tasksorg-web` no GHCR (`T1.6.3`)
- [ ] Escrever manifests do Kubernetes (`k8s/deployment.yaml`, `k8s/service.yaml`)
- [ ] Adicionar etapa de deploy ao workflow do GitHub Actions

## Produto / Plataformas

- [ ] Criar `apps/mobile` com Expo (React Native), reaproveitando `@tasksorg/core`
- [ ] Persistência real — hoje os dados ficam só no dispositivo (`localStorage` no web). Decidir entre backend próprio (API + Postgres) ou local-first com sync
- [ ] Levantar com o grupo o restante dos requisitos de produto (hoje só tarefas diária/semanal/anual + pomodoro)

## Qualidade / Arquitetura

- [x] `packages/ui` compartilhado; a base para mobile está em `@tasksorg/ui/native`
- [x] `packages/eslint-config` compartilhado (`T0.1.7`)

## Documentação

- [x] Estruturar essa página do Notion (Visão Geral, Arquitetura, DevOps, Decisões, Log de Atualizações)
- [ ] Manter o Log de Atualizações em dia a cada sessão de trabalho
