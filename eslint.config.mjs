import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", ".wrangler/**"],
  },
  // TypeScript
  {
    files: ["**/*.ts", "**/*.mjs"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off",
    },
  },
  // Client-side JS
  {
    files: ["src/components/**/*.js", "src/components/**/*.mjs", "src/pages/**/*.astro"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Astro
  ...astroPlugin.configs.recommended,
];
