import reactConfig from "@template/eslint-config/react";

export default [
  ...reactConfig,
  {
    files: ["vite.config.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
