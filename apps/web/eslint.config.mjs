import reactConfig from "@template/eslint-config/react";

export default [
  ...reactConfig,
  {
    files: ["{app,src}/**/*.{ts,tsx}"],
    rules: {
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-shorthand": "off",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
