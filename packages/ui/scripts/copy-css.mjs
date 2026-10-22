// Monta dist/styles.css (tokens + estilos dos componentes num arquivo só, sem @import)
// e publica também os tokens separados para quem só precisa das variáveis.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
const tokens = await readFile("styles/tokens.css", "utf8");
const components = await readFile("styles/index.css", "utf8");
await writeFile("dist/styles.css", `${tokens}\n${components}`);
await cp("styles/tokens.css", "dist/tokens.css");
await cp("tokens/tokens.json", "dist/tokens.json");
