// @ts-check
import js from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Configuración básica de JavaScript
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
        process: "readonly"
      },
      parserOptions: {
        ecmaVersion: "latest"
      }
    },
    rules: {
      // Reglas recomendadas de ESLint
      ...js.configs.recommended.rules,
      
      // Agregar reglas personalizadas aquí
    }
  }
];
