import base from "@tasksorg/eslint-config/base";
import { browserGlobals, nodeGlobals } from "@tasksorg/eslint-config/globals";

// O processo principal e o script de build rodam no Node; o renderer roda na janela.
export default [
  ...base,
  { files: ["src/main.ts", "*.mjs"], languageOptions: { globals: nodeGlobals } },
  { files: ["src/renderer.ts"], languageOptions: { globals: browserGlobals } },
  { files: ["*.mjs"], rules: { "no-console": "off" } },
];
