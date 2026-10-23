**Categoria:** Stack · **Status:** Aceita · **Data:** 2026-08-21

## Contexto

Precisa de um framework React maduro pra rodar como página web.

## O que foi decidido

Next.js 14 (App Router) + React 18 em `apps/web`.

## Consequências / Próximos passos

`next.config.mjs` usa `output: "standalone"` pra gerar uma imagem Docker de produção enxuta. Desde 23/10/2026 o standalone só é ligado no build do Docker (`NEXT_OUTPUT=standalone`): no Windows, os links que ele cria para o `node_modules` do pnpm faziam o build seguinte esvaziar pacotes como o `next`.

---
Voltar para [[🗳️ Decisões]]
