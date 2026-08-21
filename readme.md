# Tasks Organization App

## Comandos para rodar
Subir tudo: 
docker compose up --build

Rodar em segundo plano:
docker compose up -d

Parar tudo:
docker compose down

Remover containers e volumes:
docker compose down -v

Ver logs:
docker compose logs -f

## Criando o Bind Mount

Estando na raiz do projeto:
TasksOrganization/
├── backend/
├── frontend/
├── docker-

execute:
docker run -it \
  --name node-taskorganization \
  -v "$(pwd):/taskOrganization" \
  -w /taskOrganization \
  node:22 \
  bash

