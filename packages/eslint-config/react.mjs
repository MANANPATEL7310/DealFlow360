import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwind from "eslint-plugin-tailwindcss";
import baseConfig from "./base.mjs";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  tailwind.configs.recommended,
  {
    files: ["{app,src}/**/*.{ts,tsx}"],
    settings: {
      tailwindcss: {
        cssFiles: ["src/style.css"],
        whitelist: [
          "app-shell",
          "surface-card",
          "input-shell",
          "inputs",
          "page-title",
          "page-copy",
          "sidebar-layout",
        ],
      },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "buttonVariants",
            "meta",
            "links",
            "loader",
            "action",
            "headers",
            "handle",
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "tailwindcss/no-arbitrary-value": "error",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-shorthand": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  },
];
