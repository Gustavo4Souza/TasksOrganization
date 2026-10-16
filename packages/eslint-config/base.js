// Preset base do TasksOrg (ESLint 9, flat config).
// Não declara globals de ambiente (window, document, process...): pacotes como
// @tasksorg/core devem rodar igual em web, desktop e mobile, e o lint acusa
// qualquer uso acidental de API de plataforma. Quem precisa delas usa os
// presets `node` ou `browser`.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/.next/**", "**/.turbo/**", "**/coverage/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.test.ts", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
