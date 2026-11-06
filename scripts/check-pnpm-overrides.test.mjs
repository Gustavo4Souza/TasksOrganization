import assert from "node:assert/strict";
import test from "node:test";
import { overrideDifferences, workspaceOverrides } from "./check-pnpm-overrides.mjs";

const yaml = `packages:
  - "apps/*"
overrides:
  "postcss@^8.4.31": 8.5.32
  vite: '7.3.7'
allowBuilds:
  esbuild: true
`;

test("lê o bloco overrides do pnpm-workspace.yaml, com e sem aspas", () => {
  assert.deepEqual(workspaceOverrides(yaml), { "postcss@^8.4.31": "8.5.32", vite: "7.3.7" });
});

test("aceita overrides iguais nos dois arquivos", () => {
  assert.deepEqual(overrideDifferences({ "postcss@^8.4.31": "8.5.32", vite: "7.3.7" }, workspaceOverrides(yaml)), []);
});

test("aponta versão diferente e override ausente em um dos lados", () => {
  assert.deepEqual(overrideDifferences({ vite: "7.3.6", "js-yaml@^4.1.0": "4.3.2" }, { vite: "7.3.7" }), [
    { dependency: "js-yaml@^4.1.0", packageJson: "4.3.2", workspaceYaml: null },
    { dependency: "vite", packageJson: "7.3.6", workspaceYaml: "7.3.7" },
  ]);
});
