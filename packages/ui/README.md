# @tasksorg/ui

Pacote compartilhado do Design System pixel do TasksOrg para Web e Desktop.

## Estado atual

A `T0.2.1` estabelece a infraestrutura do pacote:

- build TypeScript com declarações (`.d.ts`);
- export público de componentes;
- export público de `styles.css`;
- configuração de lint e typecheck;
- integração com o workspace pnpm e as tarefas do Turborepo;
- entrada CSS preparada para receber tokens e estilos dos componentes.

Os tokens, as classes `px-*` e os componentes visuais serão adicionados nas
tasks seguintes do épico 0.2.

## Uso

Depois de importar o pacote no app consumidor:

```tsx
import "@tasksorg/ui/styles.css";
```

Os componentes podem ser importados pela entrada principal ou pela entrada
específica:

```tsx
import { type PolymorphicProps } from "@tasksorg/ui";
// ou
import { type PolymorphicProps } from "@tasksorg/ui/components";
```

## Desenvolvimento

Na raiz do monorepo:

```bash
pnpm --filter @tasksorg/ui build
pnpm --filter @tasksorg/ui lint
pnpm --filter @tasksorg/ui typecheck
```

O build gera os arquivos JavaScript e declarações em `dist/`, além de copiar
`styles/index.css` para `dist/styles.css`.
