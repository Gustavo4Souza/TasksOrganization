// Preset para código que roda no navegador (renderer do Electron, telas web sem Next).
import base from "./base.js";
import { browserGlobals } from "./globals.js";

export default [...base, { languageOptions: { globals: browserGlobals } }];
