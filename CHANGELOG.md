# Changelog

## [0.1.0] - 2026-11-03

### Added

- Quadro de missões com escopos diário, semanal e anual.
- Modo foco com Pomodoro, batalha e crédito de focos.
- Persistência local no Web e em `userData/tasks.json` no Desktop, com migração dos dados anteriores.
- Temas Castelo e Pergaminho, layouts responsivos e recursos de acessibilidade.
- Bandeja Desktop com fase/tempo do Pomodoro e restauração segura do monitor.
- Quadro mobile com abas de escopo e de status, contadores e Pomodoro.
- Testes unitários, cobertura do core e 32 cenários E2E no CI.
- Publicação da imagem web no GHCR a cada push na `main`.
- API Fastify com PostgreSQL, autenticação, missões, Pomodoro e progresso.
- Coleta de KPIs de deploy, incidentes, pipelines, cobertura e Lead Time.
- Manifests e CD para Web, API e PostgreSQL no Kubernetes.
- Login e sincronização mobile com sessão guardada no SecureStore.
- Login e sincronização Web/Desktop, com sessão protegida no Electron, fila offline e migração das missões locais para a conta.
- Painel de KPIs integrado à API real, com histórico e filtros de período.
- Configuração de build mobile com EAS.

### Quality

- Cobertura do core em 97,56% de statements e 91,62% de branches.
- Auditoria de acessibilidade sem violações sérias nas rotas cobertas.
- Lint, typecheck e builds Web/Desktop executados no CI.
- Instalador Windows NSIS validado localmente com ícone e fontes do projeto.
- Dez testes da API passaram contra PostgreSQL 17 real, incluindo rate limiting; mobile passou em cinco testes e exportação Android.
- Gate SARIF coberto por testes de severidade e auditoria sem achados altos/críticos.

> A tag Git `v0.1.0` deve ser criada após o merge desta documentação na `main`.
