import base from "@tasksorg/eslint-config/base";
import { nodeGlobals } from "@tasksorg/eslint-config/globals";

export default [
  ...base,
  { files: ["scripts/*.mjs", "test/**/*.mjs"], languageOptions: { globals: nodeGlobals } },
  { files: ["scripts/*.mjs"], rules: { "no-console": "off" } },
];
