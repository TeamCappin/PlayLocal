// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist", "build", "coverage", "node_modules"] },

  js.configs.recommended,

  // TypeScript (non type-aware; fast & enough for most apps)
  ...tseslint.configs.recommended,

  // If you want type-aware rules later, swap the above for:
  // ...tseslint.configs.recommendedTypeChecked,
  // { languageOptions: { parserOptions: { project: ['./tsconfig.json'] } } },

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React/Vite niceties
      "react-refresh/only-export-components": "warn",

      // Hooks correctness
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Let Prettier handle formatting
      "no-mixed-spaces-and-tabs": "off",
    },
  },
];
