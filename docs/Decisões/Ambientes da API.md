# Ambientes da API

**Categoria:** Infraestrutura · **Status:** Aceita · **Data:** 2026-11-03 · **Implementação:** Higor

## Desenvolvimento

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- PostgreSQL: porta `5433` no host, `5432` na rede Docker
- Configuração: `.env` local criado a partir de `.env.example`
- Dados persistidos no volume `tasksorg_postgres-data`

## Produção

- Web na Vercel.
- API no Render usando a imagem de `apps/api/Dockerfile`.
- PostgreSQL no Neon.
- `DATABASE_URL`, `ALLOWED_ORIGINS` e demais valores reais ficam somente nos
  secrets dos provedores e nos GitHub Environments.
- Cookies são `Secure`, `HttpOnly` e `SameSite=None`; a API restringe CORS e
  valida a origem de toda mutação.

## Homologação

O ambiente separado de homologação continua fora do escopo por decisão do
grupo no MVP 1. Pull requests usam testes automatizados, banco efêmero e builds
de contêiner; produção permanece o único ambiente remoto persistente.

## Promoção

1. Pull request passa por lint, tipos, testes, integração PostgreSQL, SAST e SCA.
2. Merge na `main` publica imagens versionadas pelo SHA.
3. Produção recebe uma versão imutável e registra o evento de deploy.
4. Falha exige rollback para o SHA anterior e registro no catálogo de KPIs.
