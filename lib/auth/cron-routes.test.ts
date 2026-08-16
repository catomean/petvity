import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Every cron route goes through requireCronAuth, and none of them re-inline the
 * check.
 *
 * This is the part that stops the bug coming back. Fixing seven routes fixes
 * seven routes; asserting it against the directory fixes the eighth one nobody
 * has written yet. A unit test on the helper cannot see a new route that simply
 * does not call it.
 */

const CRON_DIR = join(__dirname, "..", "..", "app", "api", "cron");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return entry === "route.ts" ? [full] : [];
  });
}

const routes = routeFiles(CRON_DIR);

describe("cron routes are uniformly guarded", () => {
  it("finds the cron routes at all", () => {
    // A path typo here would make every assertion below vacuously true.
    expect(routes.length).toBeGreaterThan(4);
  });

  for (const file of routes) {
    const name = file.slice(file.indexOf("app/api/cron"));
    const src = readFileSync(file, "utf8");

    it(`${name} calls requireCronAuth`, () => {
      expect(src).toContain("requireCronAuth");
    });

    it(`${name} does not compare CRON_SECRET itself`, () => {
      // The exact shape that failed open: with the variable unset this compares
      // against the string "Bearer undefined".
      expect(src).not.toMatch(/process\.env\.CRON_SECRET/);
    });
  }
});
