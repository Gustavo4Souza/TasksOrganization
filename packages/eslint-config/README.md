# @tasksorg/eslint-config

Presets de ESLint 9 (flat config) compartilhados pelo monorepo.

| Preset | Para | Globals |
|---|---|---|
| `@tasksorg/eslint-config/base` | `packages/core` e outros pacotes agnósticos de plataforma | nenhum — usar `window` ou `process` vira erro |
| `@tasksorg/eslint-config/node` | processo principal do Electron, scripts de build | Node |
| `@tasksorg/eslint-config/browser` | renderer do Electron | navegador |

## Como usar

```js
// eslint.config.js
import base from "@tasksorg/eslint-config/base";

export default base;
```

No `package.json` do pacote:

```json
"scripts": { "lint": "eslint . --max-warnings 0" },
"devDependencies": { "@tasksorg/eslint-config": "workspace:*", "eslint": "^9" }
```

O `apps/web` ainda usa `next lint` (ESLint 8). Ele passa a usar este pacote quando a T0.1.4 decidir entre `apps/web` e `frontend/`.

Pacotes com mais de um ambiente (como o `apps/desktop`) usam o `base` e aplicam `nodeGlobals` ou `browserGlobals` por arquivo, importando de `@tasksorg/eslint-config/globals`.
