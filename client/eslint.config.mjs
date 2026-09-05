import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybookPlugin from "eslint-plugin-storybook";
import securityPlugin from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    "storybook-static/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  ...storybookPlugin.configs["flat/recommended"],
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-anonymous-default-export": "off",
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/components",
              from: "./src/features",
              message: "Shared Components must not import from Feature directories.",
            },
            {
              target: "./src/components",
              from: "./src/app",
              message: "Shared Components must not import from the app (page) layer.",
            },
            {
              target: "./src/components",
              from: "./src/hooks",
              message: "Shared Components must not import from Feature-specific hooks.",
            },
            {
              target: "./src/components",
              from: "./src/stores",
              message: "Shared Components must not import from Feature-specific stores.",
            },
            {
              target: "./src/features",
              from: "./src/features/*/_services",
              message: "Feature services must not import from another feature's services.",
            },
            {
              target: "./src/components",
              from: "./src/lib/services",
              message: "Components must not import services directly; use feature hooks instead.",
            },
            {
              target: "./src/hooks",
              from: "./src/lib/services",
              message: "Shared hooks must not depend on feature services.",
            },
            {
              target: "./src/features",
              from: "./src/lib/data/repositories",
              message: "Features must not import repositories directly; use services instead.",
            },
            {
              target: "./src/app",
              from: "./src/lib/data/repositories",
              message: "Pages must not import repositories directly; use services instead.",
            },
            {
              target: "./src/features/*/components",
              from: "./src/features/*/_services",
              message: "Feature components should import services via hooks only.",
            },
            {
              target: "./src/stores",
              from: "./src/lib/services",
              message: "Stores must not import from the service layer.",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      security: securityPlugin,
    },
    rules: {
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-new-buffer": "warn",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-unsafe-regex": "error",
    },
  },
]);

export default eslintConfig;