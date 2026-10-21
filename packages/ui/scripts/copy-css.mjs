import { cp, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await cp("styles/index.css", "dist/styles.css");
