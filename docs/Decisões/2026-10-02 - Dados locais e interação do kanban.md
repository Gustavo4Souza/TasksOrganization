**Categoria:** Frontend · **Status:** Aceita · **Data:** 2026-10-02

## Contexto

O backend e os documentos de integração ainda não estão disponíveis, mas o frontend precisa permitir validar os principais fluxos do produto.

## O que foi decidido

As tarefas serão mantidas em estado local durante a POC. O usuário poderá criar tarefas com prioridade e data limite, filtrar por status e alterar o status por controles rápidos.

O Kanban terá as colunas **A fazer**, **Em andamento** e **Concluídas**. O movimento entre colunas será feito por drag and drop nativo do navegador e atualizará o status local da tarefa.

## Consequências / Próximos passos

Os dados demonstrativos tornam a interface visualizável sem API. Ao integrar persistência, as ações de criação e atualização deverão ser substituídas por uma camada de dados, preservando os componentes e os tipos do domínio.

---
Voltar para [[🗳️ Decisões]]
