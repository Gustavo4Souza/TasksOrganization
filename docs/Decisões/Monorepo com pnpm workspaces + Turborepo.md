**Categoria:** Arquitetura · **Status:** Aceita · **Data:** 2026-08-21

## Contexto

Múltiplas plataformas (web, desktop, futuramente mobile) precisam reaproveitar a mesma regra de negócio sem duplicar código.

## O que foi decidido

Organizar o projeto como monorepo: pnpm workspaces pra gerenciar os pacotes, Turborepo pra orquestrar build/lint/test/typecheck com cache incremental.

## Consequências / Próximos passos

Pacotes compartilhados (`packages/core`) ficam reaproveitados por todos os apps. Turborepo só rebuilda o que mudou.

---
Voltar para [[🗳️ Decisões]]
