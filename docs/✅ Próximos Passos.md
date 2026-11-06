Lista viva — marca como feito conforme avança, e adiciona itens novos conforme surgirem (lembrando do fluxo: pensar → documentar na base de [[🗳️ Decisões]] → desenvolver).

## DevOps

- [x] Adotar GitHub Actions como CI/CD oficial
- [x] Remover Jenkins e GitLab da configuração ativa do projeto
- [x] Criar workflow de CI com qualidade, build e imagem Docker do web
- [x] Publicar a imagem `tasksorg-web` no GHCR (`T1.6.3`)
- [x] Manter o web em produção pela integração existente com a Vercel
- [ ] Validar instalador Windows no workflow `Desktop release` (`T1.5.4`)
- [ ] Criar a tag `v0.1.0` (`T1.6.5`); o merge na `main` já foi feito no PR #52
- [ ] Mesclar as atualizações de GitHub Actions do Dependabot (#26–#28), que exigem credencial com escopo `workflow`
- [ ] Avaliar `@eslint/js` 10 junto do ESLint 10, Electron 45 (testar o desktop à mão), jsdom 30 e Vitest 5
- [x] Criar manifests Kubernetes para Web, API e PostgreSQL (`k8s/*.yaml`); validação em cluster real permanece pendente
- [ ] Fornecer cluster/credencial Kubernetes e validar API, banco e Web (`T4.1.4`–`T4.1.5`)
- [ ] Cadastrar os secrets administrativos do GitHub (`T2.3.2`) e conferir o relatório CodeQL publicado (`T3.1.2`)

## Produto / Plataformas

- [x] Criar `apps/mobile` com Expo (React Native), reaproveitando `@tasksorg/core`
- [x] Definir persistência com API própria e PostgreSQL; API, migrations, autenticação e adaptador HTTP já estão implementados
- [x] Integrar login Web/Desktop, migração dos dados locais e fila de sincronização offline (`T2.2.1`–`T2.2.5`)
- [x] Integrar os cards, histórico e filtros de KPIs à API real (`T3.3.1`–`T3.3.3`)
- [ ] Conferir o mobile em emulador/dispositivo Android (`T4.2.2`–`T4.2.3`)
- [ ] Vincular o projeto Expo, cadastrar `EXPO_TOKEN` e executar a primeira release EAS (`T4.2.5`)
- [ ] Levantar com o grupo o restante dos requisitos de produto (hoje só tarefas diária/semanal/anual + pomodoro)

## Qualidade / Arquitetura

- [x] `packages/ui` compartilhado; a base para mobile está em `@tasksorg/ui/native`
- [x] `packages/eslint-config` compartilhado (`T0.1.7`)

## Documentação

- [x] Estruturar essa página do Notion (Visão Geral, Arquitetura, DevOps, Decisões, Log de Atualizações)
- [x] Manter o Log de Atualizações em dia a cada sessão de trabalho
