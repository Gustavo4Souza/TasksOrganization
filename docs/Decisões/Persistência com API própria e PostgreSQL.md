**Categoria:** Arquitetura · **Status:** Aceita · **Data:** 2026-11-02 · **Aceite registrado por Higor em:** 2026-11-03

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

Decisão aprovada: **API própria em `apps/api` + PostgreSQL (Neon)**.

- As telas continuam falando só com `TaskRepository`. O adaptador HTTP (`T2.1.7`) substitui o local sem mudar as telas.
- O servidor é a fonte da verdade. O modo offline (`T2.2.4`) é uma fila local de alterações, enviada ao reconectar.
- Conflito: vale a alteração mais recente por missão, pelo `updatedAt` (*last write wins*). Exclusão vence edição antiga.
- A regra "uma só missão em batalha" é garantida também no servidor.
- Cada registro pertence a um usuário, e toda consulta filtra por ele (`T2.1.6`).

## Decisões complementares

1. **Conflito:** será usado *last write wins* por `updatedAt`, risco aceito para o escopo pessoal do MVP.
2. **Sessão:** cookie HTTP-only no Web/Desktop, CORS restrito por origem e validação de `Origin` nas mutações. O Mobile poderá usar o mesmo token por cabeçalho quando `T4.2.4` for executada.
3. **Framework da API:** Fastify, pela API pequena, validação explícita e testes por injeção HTTP.
4. **`updatedAt`:** o campo já existe no `Task`; dados antigos são normalizados pelo Core.

## Consequências / Próximos passos

Se aprovada, libera `T2.1.2` e, em sequência, o restante do Épico 2.1, além de `T2.3.1`, `T2.3.3` e `T3.2.5`. O modo offline fica mais simples, mas é trabalho nosso. Migrar para um motor local-first no futuro continua possível, porque as telas dependem só de `TaskRepository`.

---
Voltar para [[🗳️ Decisões]]
