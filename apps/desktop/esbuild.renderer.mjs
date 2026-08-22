import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(__dirname, "src", "renderer.ts")],
  bundle: true,
  outfile: path.join(__dirname, "dist", "renderer.js"),
  format: "iife",
  platform: "browser",
  target: "es2020",
});

console.log("renderer.js empacotado com sucesso.");
