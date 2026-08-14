import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // `next build` copies the whole project into .next/standalone/, test files
    // included, and vitest's default excludes do not cover .next — so running
    // the suite after a build collected the same tests twice and the count
    // depended on whether you had built first. Extending `exclude` replaces
    // the defaults, so node_modules and dist are restated here.
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
