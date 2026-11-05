// Garante que os overrides de segurança estejam iguais nos dois lugares:
// - package.json (`pnpm.overrides`), lido pelo pnpm 9 fixado no projeto e no CI;
// - pnpm-workspace.yaml (`overrides`), lido pelo pnpm 10+ (que ignora o package.json).
// Se um dos dois for editado sozinho, quem usar a outra versão instala dependências vulneráveis.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, "$2");

export function workspaceOverrides(yaml) {
  const overrides = {};
  let inside = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^overrides:\s*$/.test(line)) { inside = true; continue; }
    if (!inside) continue;
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+("[^"]+"|'[^']+'|[^:\s]+):\s*(.+)$/);
    if (match) overrides[unquote(match[1])] = unquote(match[2]);
  }
  return overrides;
}

export function overrideDifferences(packageOverrides = {}, yamlOverrides = {}) {
  const keys = [...new Set([...Object.keys(packageOverrides), ...Object.keys(yamlOverrides)])].sort();
  return keys
    .filter((key) => packageOverrides[key] !== yamlOverrides[key])
    .map((key) => ({ dependency: key, packageJson: packageOverrides[key] ?? null, workspaceYaml: yamlOverrides[key] ?? null }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL("../", import.meta.url);
  const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  const yaml = readFileSync(new URL("pnpm-workspace.yaml", root), "utf8");
  const differences = overrideDifferences(packageJson.pnpm?.overrides, workspaceOverrides(yaml));
  if (differences.length) {
    console.error("Overrides divergentes entre package.json e pnpm-workspace.yaml:");
    for (const item of differences) console.error(`- ${item.dependency}: package.json=${item.packageJson} | pnpm-workspace.yaml=${item.workspaceYaml}`);
    process.exit(1);
  }
  console.log("Overrides do pnpm sincronizados.");
}
