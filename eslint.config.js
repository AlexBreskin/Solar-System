import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import checkFile from "eslint-plugin-check-file";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    // Folder naming: kebab-case everywhere under src/, excluding __tests__ dirs
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**"],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/": "KEBAB_CASE" },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "max-statements-per-line": ["error", { max: 1 }],
      "one-var": ["error", "never"],
      complexity: ["warn", { max: 10 }],
    },
  },
];
