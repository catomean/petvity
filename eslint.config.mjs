import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // eslint-config-next ships `settings.react.version: 'detect'`; detection calls
  // context.getFilename(), removed in ESLint 10, and throws on every file. Pin the version.
  {
    settings: { react: { version: "19.2.8" } },
  },
  // Disable set-state-in-effect: our load functions call setLoading(true) synchronously so they
  // also work as retry callbacks — the rule generates false positives for this legitimate pattern.
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Test files: allow `any` — mocks need escape hatches to satisfy Drizzle/Next types
  // Allow `_`-prefixed unused vars — conventional "intentionally ignored" pattern in destructuring
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "lib/test-helpers/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
