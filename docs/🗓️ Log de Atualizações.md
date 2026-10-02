Registro cronológico do que foi feito em cada sessão de trabalho. Pra decisões estruturadas (o porquê das escolhas), ver a base de [[🗳️ Decisões]] — aqui é mais "o que mudou", em ordem de tempo.

## 13/09/2026 — Troca do Jenkins pelo GitLab + equipe formalizada

Duas atualizações do grupo: (1) equipe formalizada na página Visão Geral — Gustavo, Guilhermo e Higor; (2) decidido trocar o **Jenkins** pelo **GitLab CI/CD auto-hospedado** (GitLab CE em Docker, não o GitLab.com na nuvem). Por enquanto é só documentação (decisão registrada, seção "GitLab CI/CD" adicionada na página DevOps) — a implementação no código (subir GitLab CE, Runner, `.gitlab-ci.yml`, remover Jenkins) fica pro próximo passo. Seguindo o fluxo pensar → documentar → desenvolver.

## 02/09/2026 — Início da documentação no Notion

Criada a estrutura de documentação (esta página + subpáginas + base de Decisões), trazendo pra cá tudo que já tinha sido decidido nas sessões anteriores. Daqui pra frente, novas definições entram primeiro aqui, antes de virar código.

## 22/08/2026 — Jenkins rodando localmente

Resolvido conflito de porta entre o Jenkins containerizado (docker-compose) e um Jenkins nativo já instalado na máquina do Gustavo, que estava ocupando a porta 7000 como serviço do Windows. Serviço nativo parado (`Stop-Service`), Jenkins do container acessível em `http://localhost:7000`.

## 21/08/2026 — Docker + Jenkins

Adicionado ao projeto: `docker-compose.yml` (bind mount pro app web + Jenkins), `Dockerfile` de produção multi-stage pro web, imagem custom do Jenkins com Docker CLI, e `Jenkinsfile` substituindo o `.github/workflows/ci.yml` (removido). Não foi possível testar o build das imagens no ambiente onde a POC foi montada (sem acesso ao Docker Hub) — validado depois na máquina do Gustavo.

## 21/08/2026 — POC inicial

Monorepo criado do zero: pnpm workspaces + Turborepo, `packages/core` (tarefas + pomodoro, com testes Vitest), `apps/web` (Next.js) e `apps/desktop` (Electron), ambos consumindo a mesma lógica compartilhada. Pipeline de CI inicial no GitHub Actions (depois substituído pelo Jenkins). Tudo validado rodando de verdade: testes passando, build de produção do web servindo página real, Electron subindo sem erro.
