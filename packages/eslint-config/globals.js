// Conjuntos de globals para pacotes que misturam ambientes (ex.: Electron).
import globals from "globals";

export const nodeGlobals = { ...globals.node };
export const browserGlobals = { ...globals.browser };
