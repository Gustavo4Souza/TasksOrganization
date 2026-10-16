// Preset para código que roda no Node (processo principal do Electron, scripts de build).
import base from "./base.js";
import { nodeGlobals } from "./globals.js";

export default [...base, { languageOptions: { globals: nodeGlobals } }];
