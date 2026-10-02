**Categoria:** Arquitetura · **Status:** Aceita · **Data:** 2026-08-21

## Contexto

Precisa de um executável desktop reaproveitando a mesma lógica de negócio da web.

## O que foi decidido

Electron 32 em `apps/desktop`, consumindo `@tasksorg/core` (mesma lógica da web). Decisão explícita: o desktop NÃO é containerizado, porque Electron precisa de interface gráfica pra rodar de verdade, o que não faz sentido dentro de um container de CI.

## Consequências / Próximos passos

O Jenkinsfile continua buildando e validando o desktop, mas não gera uma "imagem Docker do desktop".

---
Voltar para [[🗳️ Decisões]]
