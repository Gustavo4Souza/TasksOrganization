**Categoria:** Arquitetura · **Status:** Proposta · **Data:** 2026-11-02

## Contexto

Hoje as missões ficam só no dispositivo (`localStorage` no web). O MVP 2 pede conta, dados na nuvem e sincronização entre web e desktop, e a `T2.2.4` pede funcionamento offline. As opções são:

| | API própria + Postgres, com fila offline | Local-first com motor de sincronização |
|---|---|---|
| Regras no servidor | Reaproveita `@tasksorg/core` | Parte das regras vai para o motor de sincronização |
| Compatível com [[Stack oficial de hospedagem]] | Sim: Render + Neon | Pede serviço ou biblioteca nova |
| KPIs (`T3.2.5`) | Mesma API e mesmo banco | Precisa de um backend à parte |
| Autorização por usuário | Simples, na API | Depende do motor |
| Conflitos offline | Regra simples, definida por nós | Automáticos, com mais complexidade |
| Telas já prontas | `/auth/*` e `/kpis` já chamam uma API HTTP | Precisam mudar |

## O que foi decidido

Proposta para aprovação do grupo: **API própria em `apps/api` + PostgreSQL (Neon)**.

- As telas continuam falando só com `TaskRepository`. O adaptador HTTP (`T2.1.7`) substitui o local sem mudar as telas.
- O servidor é a fonte da verdade. O modo offline (`T2.2.4`) é uma fila local de alterações, enviada ao reconectar.
- Conflito: vale a alteração mais recente por missão, pelo `updatedAt` (*last write wins*). Exclusão vence edição antiga.
- A regra "uma só missão em batalha" é garantida também no servidor.
- Cada registro pertence a um usuário, e toda consulta filtra por ele (`T2.1.6`).

## Pontos a confirmar com o grupo

1. **Conflito:** *last write wins* basta? Pode perder uma edição feita em dois dispositivos ao mesmo tempo. É um risco aceitável para um app pessoal.
2. **Sessão:** a tela de login usa cookie (`credentials: "include"`). Com web na Vercel e API no Render em domínios diferentes, o cookie exige `SameSite=None; Secure`, CORS restrito e proteção contra CSRF, ou um domínio comum. O mobile tende a precisar de token.
3. **Framework da API:** a escolha fica para a `T2.1.2`.
4. **`updatedAt`:** o `Task` precisa ganhar esse campo no core, com migração dos dados locais.

## Consequências / Próximos passos

Se aprovada, libera `T2.1.2` e, em sequência, o restante do Épico 2.1, além de `T2.3.1`, `T2.3.3` e `T3.2.5`. O modo offline fica mais simples, mas é trabalho nosso. Migrar para um motor local-first no futuro continua possível, porque as telas dependem só de `TaskRepository`.

---
Voltar para [[🗳️ Decisões]]
