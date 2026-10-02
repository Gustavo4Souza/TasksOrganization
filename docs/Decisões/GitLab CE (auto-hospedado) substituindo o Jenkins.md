**Categoria:** DevOps · **Status:** Substituída · **Data:** 2026-09-13

## Contexto

Time reavaliou a ferramenta de CI/CD do projeto e decidiu trocar o Jenkins pelo GitLab.

## O que foi decidido

Adotar GitLab CE auto-hospedado (rodando em Docker, no mesmo espírito do setup anterior do Jenkins), em vez do GitLab.com (nuvem). O Jenkins e seus arquivos (`Jenkinsfile`, `devops/jenkins/`, serviço `jenkins` no `docker-compose.yml`) vão ser removidos do repositório e substituídos por um `.gitlab-ci.yml`. Ainda NÃO implementado — por enquanto só documentado, seguindo o fluxo pensar → documentar → desenvolver.

## Consequências / Próximos passos

Implementação pendente: (1) subir GitLab CE via docker-compose (é bem mais pesado que o Jenkins — mais RAM/CPU/disco), (2) configurar um GitLab Runner com acesso ao Docker do host (mesmo padrão DooD usado no Jenkins), (3) escrever `.gitlab-ci.yml` espelhando os stages que o Jenkinsfile já tinha (deps → qualidade → build → build da imagem Docker), (4) remover `Jenkinsfile` e `devops/jenkins/` do repositório.

> [!warning] SUBSTITUÍDA em 18/09/2026
> O grupo decidiu voltar pro GitHub Actions antes de implementar o GitLab. Ver decisão "GitHub Actions de volta como CI/CD" — **essa decisão ainda não tem página própria na base do Notion** (era só uma nota de texto nesta linha no momento da migração, 18/09/2026). Criar a nota aqui assim que ela existir no Notion.

---
Voltar para [[🗳️ Decisões]]
