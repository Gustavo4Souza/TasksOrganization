**Categoria:** Arquitetura · **Status:** Aceita · **Data:** 2026-08-21

## Contexto

Web e Desktop precisam se comportar exatamente igual (mesmas regras de tarefas e do timer pomodoro), sem duplicar implementação.

## O que foi decidido

Criar `packages/core`: modelo de `Task` (escopo diário/semanal/anual, status, prioridade) e uma máquina de estados `PomodoroTimer`, sem NENHUMA dependência de UI/DOM/Electron. Testado com Vitest.

## Consequências / Próximos passos

13 testes unitários passando. Web e Desktop importam e usam exatamente o mesmo pacote — prova de conceito de reaproveitamento real entre plataformas.

---
Voltar para [[🗳️ Decisões]]
