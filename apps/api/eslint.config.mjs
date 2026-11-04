import base from "@tasksorg/eslint-config/base";
import { nodeGlobals } from "@tasksorg/eslint-config/globals";

export default [
  ...base,
  { files: ["src/**/*.ts", "test/**/*.ts"], languageOptions: { globals: nodeGlobals } },
];
