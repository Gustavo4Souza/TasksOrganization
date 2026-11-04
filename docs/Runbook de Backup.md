# Runbook de backup do PostgreSQL

**Implementado por Higor para `T2.3.5`.**

O workflow `Database backup` executa diariamente às 03:15 UTC e também pode
ser disparado manualmente. Ele usa o secret `DATABASE_URL` do environment
`production`, cria um dump PostgreSQL no formato customizado e o mantém como
artefato restrito por 14 dias.

## Restaurar

1. Baixar o artefato desejado no GitHub Actions.
2. Criar um banco vazio e restringir o acesso durante a restauração.
3. Executar `pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" arquivo.dump`.
4. Conferir `/ready`, contagens das tabelas e login de uma conta de teste.
5. Reabrir o tráfego e registrar a restauração como incidente/deploy nos KPIs.

Uma restauração de teste deve ser executada periodicamente; backup sem teste de
restauração não é considerado validado.
