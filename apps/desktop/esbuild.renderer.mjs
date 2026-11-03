import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { copyFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(__dirname, "src", "renderer.tsx")],
  bundle: true,
  outfile: path.join(__dirname, "dist", "renderer.js"),
  format: "iife",
  platform: "browser",
  target: "es2020",
});

await copyFile(
  path.join(__dirname, "..", "..", "packages", "ui", "styles", "tokens.css"),
  path.join(__dirname, "dist", "tokens.css"),
);
await copyFile(
  path.join(__dirname, "..", "..", "packages", "ui", "dist", "styles.css"),
  path.join(__dirname, "dist", "styles.css"),
);
await copyFile(
  path.join(__dirname, "renderer", "desktop.css"),
  path.join(__dirname, "dist", "desktop.css"),
);

console.log("renderer.js empacotado com sucesso.");
