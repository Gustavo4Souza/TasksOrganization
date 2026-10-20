**Categoria:** Infraestrutura · **Status:** Aceita · **Data:** 2026-10-16

## O que foi decidido

O TasksOrg utilizará:

- **Vercel** para hospedagem do frontend web (`apps/web`);
- **Render** para hospedagem do backend/API (`apps/api`);
- **Neon** como PostgreSQL gerenciado.

Docker e GitHub Actions continuam sendo usados no desenvolvimento, na
validação e na construção das imagens. Kubernetes permanece como evolução
futura, não como requisito da primeira entrega hospedada.

## Consequências

- A integração real com a API e o banco ocorre no MVP 2.
- Variáveis de ambiente e secrets deverão ser configurados por ambiente.
- O pipeline deverá publicar e/ou acionar deploys conforme a estratégia de
  release definida no MVP 1 e no MVP 2.
- A arquitetura deve manter o frontend desacoplado da infraestrutura do
  backend, comunicando-se por API.

---
Voltar para [[🗳️ Decisões]]
