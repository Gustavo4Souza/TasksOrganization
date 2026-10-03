**Categoria:** Frontend · **Status:** Aceita · **Data:** 2026-10-02

## Contexto

O frontend estava em estado de POC, com uma lista simples de tarefas e um timer Pomodoro. Foi definida a primeira experiência do produto de organização pessoal.

## O que foi decidido

`apps/web` será a aplicação web principal. A navegação terá apenas as áreas **Visão geral**, **Minhas tarefas** e **Kanban**. A lista de concluídas será um filtro dentro de Minhas tarefas, e não uma área separada.

A Visão geral será a tela inicial, com indicadores de tarefas, prioridades do dia, criação rápida e um widget de Pomodoro. O timer reutilizará `PomodoroTimer` do pacote `@tasksorg/core`.

## Consequências / Próximos passos

Nesta primeira entrega, as tarefas ficam em estado local para validar o fluxo e a interface. A persistência por API será conectada posteriormente sem mudar a organização das telas.

---
Voltar para [[🗳️ Decisões]]
