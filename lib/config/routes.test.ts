/**
 * Portal paths live in exactly one place.
 *
 * They were literals scattered through the nav: 38 occurrences of thirteen
 * paths in `SidebarNav.tsx` alone, with `/portal/dashboard` and `/portal/find`
 * hand-typed six times each. Renaming a route meant finding every copy, and a
 * missed one did not fail to compile — it became a dead link only a visitor
 * would discover.
 *
 * This test is the reason it stays fixed. A literal creeping back into a nav
 * component fails here rather than in production.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PORTAL_ROUTES } from "./routes";

const ROOT = join(__dirname, "..", "..");
const NAV_DIRS = [join(ROOT, "components", "portal")];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...tsxFiles(full));
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("PORTAL_ROUTES", () => {
  it("has no duplicate paths", () => {
    const values = Object.values(PORTAL_ROUTES);
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses the /portal prefix consistently", () => {
    for (const path of Object.values(PORTAL_ROUTES)) {
      expect(path.startsWith("/portal/")).toBe(true);
      expect(path.endsWith("/")).toBe(false);
    }
  });

  it("is the only place a portal path is written down", () => {
    const offenders: string[] = [];
    for (const dir of NAV_DIRS) {
      for (const file of tsxFiles(dir)) {
        const source = readFileSync(file, "utf8");
        for (const [line, text] of source.split("\n").entries()) {
          // Match a quoted /portal/... literal. The constants file itself is
          // not scanned — it is the one place these are allowed to exist.
          if (/["'`]\/portal\/[a-z-]+/.test(text)) {
            offenders.push(`${file.replace(ROOT + "/", "")}:${line + 1}  ${text.trim()}`);
          }
        }
      }
    }
    expect(offenders, `import from @/lib/config/routes instead:\n${offenders.join("\n")}`).toEqual(
      [],
    );
  });
});
