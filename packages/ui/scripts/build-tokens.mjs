// Gera styles/tokens.css a partir de tokens/tokens.json.
//   node scripts/build-tokens.mjs          grava o arquivo
//   node scripts/build-tokens.mjs --check  só confere se o arquivo está atualizado (CI)
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildTokensCss } from "./tokens.mjs";

const root = new URL("..", import.meta.url);
const source = fileURLToPath(new URL("tokens/tokens.json", root));
const target = fileURLToPath(new URL("styles/tokens.css", root));

const css = buildTokensCss(JSON.parse(await readFile(source, "utf8")));

if (process.argv.includes("--check")) {
  const current = (await readFile(target, "utf8").catch(() => "")).replace(/\r\n/g, "\n");
  if (current !== css) {
    console.error("styles/tokens.css está desatualizado. Rode: pnpm --filter @tasksorg/ui tokens");
    process.exit(1);
  }
  console.log("styles/tokens.css está atualizado.");
} else {
  await writeFile(target, css);
  console.log("styles/tokens.css gerado.");
}
