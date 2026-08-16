/**
 * Static i18n key audit — every literal key passed to a translator must exist
 * in messages/en.json under that translator's namespace.
 *
 * Why: next-intl renders missing keys as the raw "namespace.key" string in
 * production (MISSING_MESSAGE is only an error server-side). That shipped as
 * "public.adoptFilterAll" showing verbatim on the public adopt page. tsc and
 * eslint are both blind to it; this test is not.
 *
 * Scope: literal keys only. Dynamic keys (t(`species_${x}`), t(someVar)) are
 * skipped — they need runtime knowledge this static pass can't have.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..", "..");
const SOURCE_DIRS = ["app", "components", "hooks", "lib"];
const messages = JSON.parse(readFileSync(join(ROOT, "messages", "en.json"), "utf8"));

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) yield full;
  }
}

function hasKey(namespace: string, key: string): boolean {
  // Keys may be nested via dots inside a namespace (next-intl convention).
  let node: unknown = messages[namespace];
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return node !== undefined;
}

/** translator variable name → namespace, per file */
function translatorBindings(src: string): Map<string, string> {
  const bindings = new Map<string, string>();
  // const t = useTranslations("portal")   |  await getTranslations("portal")
  const simple = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*"([^"]+)"\s*\)/g;
  // await getTranslations({ locale, namespace: "public" })
  const objArg = /(?:const|let)\s+(\w+)\s*=\s*await\s+getTranslations\(\s*\{[^}]*namespace:\s*"([^"]+)"[^}]*\}\s*\)/g;
  for (const re of [simple, objArg]) {
    for (const m of src.matchAll(re)) bindings.set(m[1], m[2]);
  }
  return bindings;
}

describe("i18n literal keys resolve in messages/en.json", () => {
  const missing: string[] = [];

  for (const dir of SOURCE_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const src = readFileSync(file, "utf8");
      const bindings = translatorBindings(src);
      if (bindings.size === 0) continue;

      for (const [varName, namespace] of bindings) {
        // t("key"…  |  t.rich("key"…  |  t.raw("key"…  — literal string keys only
        const call = new RegExp(`(?<![\\w.])${varName}(?:\\.(?:rich|raw|markup))?\\(\\s*"([^"$\`]+)"`, "g");
        for (const m of src.matchAll(call)) {
          const key = m[1];
          if (!hasKey(namespace, key)) {
            missing.push(`${relative(ROOT, file)}: ${namespace}.${key}`);
          }
        }
      }
    }
  }

  it("has no unresolved keys", () => {
    expect(missing, `Missing message keys:\n${missing.join("\n")}`).toEqual([]);
  });
});

/**
 * Every locale carries every key.
 *
 * The test above only proves en.json is complete. A key added to en and
 * forgotten in de renders the raw "public.cartAdd" to a German shopper — the
 * same production-visible failure, one file over. The nine files were in exact
 * parity when this was written; this keeps them there.
 */
describe("all locales mirror en.json", () => {
  function flatten(obj: unknown, prefix = ""): string[] {
    if (typeof obj !== "object" || obj === null) return [prefix];
    return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
  }

  const enKeys = flatten(messages).sort();
  const locales = readdirSync(join(ROOT, "messages"))
    .filter((f) => f.endsWith(".json") && f !== "en.json")
    .map((f) => f.replace(/\.json$/, ""));

  it("finds locale files to check", () => {
    expect(locales.length).toBeGreaterThan(0);
  });

  for (const locale of locales) {
    it(`${locale} has exactly the keys en has`, () => {
      const other = JSON.parse(
        readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"),
      );
      const otherKeys = flatten(other).sort();
      const missingHere = enKeys.filter((k) => !otherKeys.includes(k));
      const extraHere = otherKeys.filter((k) => !enKeys.includes(k));
      expect(missingHere, `${locale} is missing keys present in en`).toEqual([]);
      expect(extraHere, `${locale} has keys en does not`).toEqual([]);
    });
  }
});
