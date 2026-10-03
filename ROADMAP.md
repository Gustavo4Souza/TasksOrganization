# 🚀 TasksOrg — Roadmap do Projeto

> Gerenciador de tarefas multiplataforma inspirado no Notion, desenvolvido com foco em **DevOps, DevSecOps, CI/CD, testes automatizados e monitoramento de KPIs**.

---

## 📌 Visão Geral

O **TasksOrg** é um aplicativo de organização pessoal com suporte a:

- 📋 Tarefas
- 📅 Tarefas diárias, semanais e anuais
- 🎯 Prioridades
- ✅ Status de tarefas
- 🍅 Timer Pomodoro
- 📊 Dashboard
- 🔐 Autenticação
- 💾 Persistência de dados
- 🌐 Aplicação Web
- 🖥️ Aplicação Desktop
- 📱 Aplicação Mobile — futura
- 🐳 Docker
- ⚙️ CI/CD
- 🧪 Testes automatizados
- 🔒 DevSecOps / SAST
- 📈 KPIs de DevOps
- ☸️ Kubernetes — futura etapa

O projeto segue o fluxo:

```text
PLAN → CODE → BUILD → TEST → RELEASE → DEPLOY → OPERATE → MONITOR
```

---

## 👥 Equipe

| Integrante | Área principal | Responsabilidades |
|---|---|---|
| 👨‍💻 Higor | Produto + Frontend | Interface, UX, funcionalidades, Dashboard e integração |
| 👨‍💻 Gustavo | Backend + Qualidade | API, banco de dados, regras de negócio e testes |
| 👨‍💻 Guilhermo | DevOps + DevSecOps | Docker, CI/CD, SAST, Deploy, Monitoramento e KPIs |

> A divisão define o responsável principal por cada área. Todos os integrantes devem participar das revisões de código e integração das funcionalidades.

---

## 🏗️ Arquitetura

```text
                         ┌──────────────────┐
                         │     TasksOrg     │
                         └────────┬─────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 ↓                ↓                ↓
              Web App          Desktop          Mobile
              Next.js         Electron           Expo
                 │                │                │
                 └────────────────┼────────────────┘
                                  ↓
                         @tasksorg/core
                                  │
                                  ↓
                                API
                                  │
                                  ↓
                              Database
```

### Stack atual

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Monorepo | pnpm Workspaces + Turborepo |
| Web | Next.js + React |
| Desktop | Electron |
| Mobile | Expo / React Native — futuro |
| Core | `@tasksorg/core` |
| Testes | Vitest |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Segurança | SAST |
| Orquestração | Kubernetes — futuro |

---

## 🗺️ Roadmap

### 🟦 FASE 0 — Planejamento e Organização

**🎯 Objetivo:** Organizar o projeto antes do desenvolvimento das funcionalidades.

#### Higor
- [ ] Levantar requisitos funcionais
- [ ] Definir fluxo de usuário
- [ ] Criar wireframes
- [ ] Definir telas principais
- [ ] Definir identidade visual
- [ ] Documentar funcionalidades

#### Gustavo
- [ ] Levantar entidades do sistema
- [ ] Definir modelo de dados
- [ ] Definir estrutura da API
- [ ] Definir estratégia de testes
- [ ] Revisar `packages/core`

#### Guilhermo
- [ ] Revisar configuração Docker
- [ ] Revisar estrutura de CI/CD
- [ ] Definir ambientes
- [ ] Definir estratégia de SAST
- [ ] Definir coleta dos KPIs

#### Entregáveis
- [ ] Requisitos documentados
- [ ] Arquitetura documentada
- [ ] Wireframes
- [ ] Estrutura inicial do projeto
- [ ] Estratégia de DevOps documentada

---

### 🟩 FASE 1 — Produto Mínimo Viável

**🎯 Objetivo:** Transformar a POC em um gerenciador de tarefas funcional.

#### Funcionalidades
- [ ] Criar tarefa
- [ ] Editar tarefa
- [ ] Excluir tarefa
- [ ] Concluir tarefa
- [ ] Alterar status
- [ ] Definir prioridade
- [ ] Filtrar tarefas
- [ ] Tarefas diárias
- [ ] Tarefas semanais
- [ ] Tarefas anuais
- [ ] Dashboard inicial
- [ ] Pomodoro

#### Higor — Frontend
- [ ] Dashboard
- [ ] Lista de tarefas
- [ ] Formulário de criação
- [ ] Edição de tarefas
- [ ] Filtros
- [ ] Prioridades
- [ ] Visualização diária
- [ ] Visualização semanal
- [ ] Visualização anual
- [ ] Interface do Pomodoro

#### Gustavo — Backend
- [ ] Modelagem inicial
- [ ] Regras de negócio
- [ ] CRUD de tarefas
- [ ] API
- [ ] Validações
- [ ] Regras do Pomodoro

#### Guilhermo — Infraestrutura
- [ ] Docker
- [ ] Docker Compose
- [ ] `.env.example`
- [ ] Ambiente de desenvolvimento
- [ ] Ambiente de testes
- [ ] Health check inicial

---

### 🟨 FASE 2 — Persistência e Backend

**🎯 Objetivo:** Substituir o armazenamento em memória por persistência real.

```text
Frontend
   ↓
API
   ↓
Database
```

#### Gustavo
- [ ] Configurar banco de dados
- [ ] Criar migrations
- [ ] Criar models
- [ ] Criar repositórios
- [ ] Implementar CRUD
- [ ] Implementar autenticação
- [ ] Implementar autorização
- [ ] Implementar persistência
- [ ] Implementar histórico de Pomodoro

#### Higor
- [ ] Integrar frontend com API
- [ ] Estados de loading
- [ ] Tratamento de erros
- [ ] Autenticação no frontend
- [ ] Gerenciamento de sessão
- [ ] Feedback visual das operações

#### Guilhermo
- [ ] Container do backend
- [ ] Container do banco
- [ ] Variáveis de ambiente
- [ ] Health checks
- [ ] Configuração dos ambientes

---

### 🧪 FASE 3 — Testes Automatizados

**🎯 Objetivo:** Garantir qualidade e preparar a aplicação para CI/CD.

```text
                    TESTES
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      Unitários    Integração      E2E
```

#### Gustavo
- [ ] Testes unitários
- [ ] Testes de regras de negócio
- [ ] Testes da API
- [ ] Testes de integração
- [ ] Testes de autenticação
- [ ] Testes de permissões
- [ ] Testes do Pomodoro

#### Higor
- [ ] Testes de componentes
- [ ] Testes de formulários
- [ ] Testes de criação de tarefa
- [ ] Testes de conclusão
- [ ] Testes de filtros
- [ ] Testes do Dashboard

#### Guilhermo
- [ ] Configurar execução automática dos testes
- [ ] Integrar testes ao CI
- [ ] Gerar relatório dos testes
- [ ] Registrar testes bem-sucedidos
- [ ] Registrar testes malsucedidos

---

### ⚙️ FASE 4 — CI/CD

**🎯 Objetivo:** Automatizar validação, build e deploy do projeto.

```text
Git Push / Pull Request
          ↓
    GitHub Actions
          ↓
       Install
          ↓
        Lint
          ↓
      Typecheck
          ↓
        Tests
          ↓
        SAST
          ↓
        Build
          ↓
    Docker Image
          ↓
       Release
          ↓
       Deploy
```

#### Guilhermo
- [ ] Criar `.github/workflows/ci.yml`
- [ ] Criar workflow de CI
- [ ] Configurar instalação de dependências
- [ ] Configurar lint
- [ ] Configurar typecheck
- [ ] Configurar testes
- [ ] Configurar build
- [ ] Configurar Docker
- [ ] Criar workflow de CD
- [ ] Configurar deploy
- [ ] Configurar Docker Registry

#### Higor
- [ ] Corrigir problemas encontrados pelo CI
- [ ] Garantir build correto do frontend
- [ ] Validar comportamento após deploy

#### Gustavo
- [ ] Corrigir falhas de testes
- [ ] Garantir compatibilidade da API
- [ ] Validar build do backend

---

### 🔐 FASE 5 — DevSecOps / SAST

**🎯 Objetivo:** Adicionar segurança ao processo de desenvolvimento.

```text
Developer
    ↓
Git Push
    ↓
GitHub Actions
    ↓
   SAST
    ↓
Security Gate
    ↓
 ┌───────┐
 │       │
 OK    Falha
 │       │
 ↓       ↓
Build   Bloqueio
```

**SAST — Static Application Security Testing:** responsável por analisar o código-fonte em busca de possíveis vulnerabilidades antes do deploy.

#### Guilhermo
- [ ] Escolher ferramenta SAST
- [ ] Configurar SAST no GitHub Actions
- [ ] Configurar Security Gate
- [ ] Definir níveis de severidade
- [ ] Gerar relatório de vulnerabilidades
- [ ] Documentar processo de segurança

#### Gustavo
- [ ] Corrigir vulnerabilidades encontradas no backend
- [ ] Revisar dependências
- [ ] Validar segurança da API

#### Higor
- [ ] Corrigir vulnerabilidades encontradas no frontend
- [ ] Revisar dependências frontend
- [ ] Validar entradas de usuário

---

### 📊 FASE 6 — KPIs de DevOps

**🎯 Objetivo:** Medir o desempenho e a qualidade do processo de desenvolvimento e entrega.

#### 1. 🚀 Frequência de Implantação

Mede quantas vezes o sistema é implantado em determinado período.

```text
Deployment Frequency = Quantidade de Deploys / Período
```

**Responsável:** Guilhermo

- [ ] Registrar cada deploy
- [ ] Armazenar data/hora
- [ ] Identificar versão
- [ ] Criar métrica semanal
- [ ] Criar métrica mensal

#### 2. ⚠️ Taxa de Falha de Alterações

Mede a proporção de alterações implantadas que resultaram em falha, rollback, hotfix ou incidente.

```text
Change Failure Rate = Deployments com falha / Total de Deployments × 100
```

**Responsáveis:** Guilhermo + Gustavo

- [ ] Definir o que será considerado uma falha
- [ ] Registrar falhas
- [ ] Registrar rollbacks
- [ ] Registrar hotfixes
- [ ] Calcular percentual
- [ ] Exibir no Dashboard

#### 3. 🔄 Tempo Médio de Recuperação — MTTR

Mede o tempo necessário para restaurar o sistema após um incidente.

```text
MTTR = Tempo total de recuperação / Número de incidentes
```

**Responsável:** Guilhermo

- [ ] Registrar início do incidente
- [ ] Registrar identificação
- [ ] Registrar correção
- [ ] Registrar recuperação
- [ ] Calcular MTTR
- [ ] Exibir histórico

#### 4. 🧪 Testes Bem-Sucedidos / Malsucedidos

Mede a quantidade e proporção de testes executados com sucesso ou falha.

```text
Taxa de sucesso = Testes aprovados / Total de testes × 100
```

**Responsáveis:** Gustavo + Guilhermo

- [ ] Registrar testes executados
- [ ] Registrar testes aprovados
- [ ] Registrar testes falhos
- [ ] Calcular taxa de sucesso
- [ ] Exibir histórico
- [ ] Integrar ao CI/CD

---

### 📈 FASE 7 — Dashboard de DevOps

**🎯 Objetivo:** Criar uma área no TasksOrg para visualizar os KPIs.

```text
┌───────────────────────────────────────────┐
│              TasksOrg DevOps              │
├────────────────┬───────────────┬──────────┤
│  Deployments   │ Failure Rate  │   MTTR   │
│       18       │      11%      │  32 min  │
├────────────────┴───────────────┴──────────┤
│                                           │
│                  Testes                   │
│        ████████████████████░ 94%          │
│                                           │
├───────────────────────────────────────────┤
│           Deployment Frequency            │
│                                           │
│        ●                                  │
│      ●   ●       ●                        │
│    ●       ● ●                            │
│                                           │
└───────────────────────────────────────────┘
```

#### Higor
- [ ] Criar tela de Dashboard
- [ ] Criar cards dos KPIs
- [ ] Criar gráficos
- [ ] Criar filtros por período
- [ ] Criar histórico

#### Gustavo
- [ ] Definir estrutura dos dados
- [ ] Criar endpoints dos KPIs
- [ ] Validar cálculos

#### Guilhermo
- [ ] Integrar dados do CI/CD
- [ ] Automatizar coleta
- [ ] Integrar dados de deploy
- [ ] Integrar dados de testes

---

### 🖥️ FASE 8 — Desktop

A aplicação Desktop utilizará **Electron** e deverá reaproveitar a lógica existente em `@tasksorg/core`.

```text
              @tasksorg/core
                    │
             ┌──────┴──────┐
             ↓             ↓
           Web          Electron
```

#### Higor
- [ ] Interface Desktop
- [ ] Navegação
- [ ] Integração com funcionalidades
- [ ] Ajustes de UX

#### Gustavo
- [ ] Validar regras compartilhadas
- [ ] Validar persistência
- [ ] Testar funcionalidades

#### Guilhermo
- [ ] Configurar build do Electron
- [ ] Integrar build ao CI
- [ ] Gerar artefatos
- [ ] Configurar release

---

### ☸️ FASE 9 — Kubernetes

Etapa posterior ao funcionamento do Docker + CI/CD.

#### Estrutura

```text
k8s/
├── deployment.yaml
├── service.yaml
├── configmap.yaml
└── secret.yaml
```

#### Guilhermo
- [ ] Configurar Kubernetes
- [ ] Criar Deployment
- [ ] Criar Service
- [ ] Criar ConfigMap
- [ ] Criar Secrets
- [ ] Configurar health checks
- [ ] Integrar Kubernetes ao CD
- [ ] Testar deploy local

#### Gustavo
- [ ] Validar aplicação no ambiente Kubernetes
- [ ] Validar banco
- [ ] Validar API

#### Higor
- [ ] Validar frontend
- [ ] Validar acesso
- [ ] Testar comportamento da aplicação

---

### 📱 FASE 10 — Mobile

Etapa futura.

A aplicação Mobile será desenvolvida utilizando **Expo / React Native**, reaproveitando `@tasksorg/core`.

```text
                 @tasksorg/core
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         Web        Desktop       Mobile
       Next.js      Electron       Expo
```

#### Higor
- [ ] Interface Mobile
- [ ] Navegação
- [ ] Responsividade
- [ ] UX Mobile

#### Gustavo
- [ ] Integração com API
- [ ] Autenticação
- [ ] Testes

#### Guilhermo
- [ ] CI Mobile
- [ ] Build
- [ ] Release
- [ ] Automação

---

## 📅 Cronograma de Sprints

| Sprint | Objetivo | Principais entregas |
|---|---|---|
| Sprint 1 | Planejamento | Requisitos + arquitetura + wireframes |
| Sprint 2 | Estrutura | UI + banco + Docker |
| Sprint 3 | Tarefas | CRUD completo |
| Sprint 4 | Backend | API + autenticação + persistência |
| Sprint 5 | Qualidade | Testes + Pomodoro |
| Sprint 6 | CI/CD | GitHub Actions + Build |
| Sprint 7 | DevSecOps | SAST + Security Gate |
| Sprint 8 | KPIs | Coleta + Dashboard |
| Sprint 9 | Deploy | Docker + Deploy + Monitoramento |
| Sprint 10 | Finalização | Kubernetes + documentação + apresentação |

---

## 🔄 Fluxo de Desenvolvimento

Toda funcionalidade deve seguir o seguinte processo:

```text
┌──────────────┐
│     PLAN     │
└──────┬───────┘
       ↓
┌──────────────┐
│     CODE     │
└──────┬───────┘
       ↓
┌──────────────┐
│     BUILD    │
└──────┬───────┘
       ↓
┌──────────────┐
│     TEST     │
└──────┬───────┘
       ↓
┌──────────────┐
│     SAST     │
└──────┬───────┘
       ↓
┌──────────────┐
│    RELEASE   │
└──────┬───────┘
       ↓
┌──────────────┐
│    DEPLOY    │
└──────┬───────┘
       ↓
┌──────────────┐
│    OPERATE   │
└──────┬───────┘
       ↓
┌──────────────┐
│    MONITOR   │
└──────┬───────┘
       ↓
      KPIs
       │
       └──────────────→ PLAN
```

---

## 📋 Definition of Done

Uma funcionalidade só será considerada concluída quando:

- [ ] Requisito documentado
- [ ] Implementação concluída
- [ ] Código revisado
- [ ] Testes implementados
- [ ] Testes passando
- [ ] Lint passando
- [ ] Typecheck passando
- [ ] SAST sem bloqueios
- [ ] Build funcionando
- [ ] Docker funcionando
- [ ] Deploy realizado
- [ ] Monitoramento validado
- [ ] Documentação atualizada

---

## 🛡️ Pipeline Final

```text
                         DEVELOPER
                             │
                             ↓
                         Git / PR
                             │
                             ↓
                    ┌─────────────────┐
                    │ GitHub Actions  │
                    └────────┬────────┘
                             ↓
                    Install Dependencies
                             ↓
                            Lint
                             ↓
                          Typecheck
                             ↓
                           Tests
                             ↓
                            SAST
                             ↓
                           BUILD
                             ↓
                        Docker Image
                             ↓
                          RELEASE
                             ↓
                           DEPLOY
                             ↓
                          OPERATE
                             ↓
                          MONITOR
                             ↓
                            KPIs
                             │
                             ↓
                         Dashboard
```

---

## 📊 KPIs do Projeto

| KPI | Descrição | Fonte | Responsável |
|---|---|---|---|
| 🚀 Frequência de implantação | Quantidade de deploys por período | CI/CD | Guilhermo |
| ⚠️ Taxa de falha de alterações | Alterações que resultaram em falha | CI/CD + Incidentes | Guilhermo + Gustavo |
| 🔄 MTTR | Tempo médio para recuperação | Incidentes | Guilhermo |
| 🧪 Testes sucesso/falha | Resultado dos testes automatizados | CI/CD | Gustavo + Guilhermo |
| 🔐 SAST | Vulnerabilidades encontradas no código | SAST | Guilhermo |

---

## 🎯 Resultado Final

Ao final do projeto, o TasksOrg deverá demonstrar:

- [ ] Aplicação Web funcional
- [ ] Aplicação Desktop funcional
- [ ] Backend funcional
- [ ] Banco de dados
- [ ] Docker
- [ ] CI/CD com GitHub Actions
- [ ] Testes automatizados
- [ ] SAST / DevSecOps
- [ ] Deploy automatizado
- [ ] Monitoramento
- [ ] Dashboard de KPIs
- [ ] Frequência de implantação
- [ ] Taxa de falha de alterações
- [ ] MTTR
- [ ] Testes bem-sucedidos/malsucedidos
- [ ] Documentação técnica
- [ ] Kubernetes como etapa de evolução

---

## 👨‍💻 Responsabilidade Final

| Higor | Gustavo | Guilhermo |
|---|---|---|
| Produto | Backend | DevOps |
| Frontend | Banco | CI/CD |
| UX/UI | API | Docker |
| Dashboard | Regras | SAST |
| Web | Testes | Deploy |
| Desktop | Qualidade | Monitoramento |
| | | KPIs |

> **Regra do projeto:** cada integrante possui uma área principal de responsabilidade, mas todas as entregas devem passar por integração e revisão dos demais integrantes.
