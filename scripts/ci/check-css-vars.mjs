#!/usr/bin/env node
/**
 * Design-token integrity gate.
 *
 * globals.css is the SSOT for CSS custom properties. When a token is renamed
 * or removed there, any component still referencing it silently renders with
 * an unresolved var() — invisible to tsc, eslint, and the build. This gate
 * fails `verify` on any var(--x) reference (or semantic class usage) that
 * globals.css no longer defines.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CSS_FILE = "app/globals.css";
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXT = /\.(tsx|ts|css)$/;

const css = readFileSync(CSS_FILE, "utf8");

// Tokens defined in globals.css (":root" and anywhere else, e.g. media queries)
const definedVars = new Set([...css.matchAll(/(^|[\s;{])(--[a-z0-9-]+)\s*:/gim)].map((m) => m[2]));

// Vars Tailwind/next-font define outside globals.css
const EXTERNAL_VARS = new Set(["--font-sans", "--font-display", "--font-mono", "--tw-"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(p);
    } else if (SCAN_EXT.test(entry)) {
      yield p;
    }
  }
}

const errors = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/var\((--[a-z0-9-]+)[),]/g)) {
        const name = m[1];
        if (definedVars.has(name)) continue;
        if ([...EXTERNAL_VARS].some((v) => name === v || name.startsWith("--tw-"))) continue;
        // globals.css referencing its own definitions is covered by definedVars
        errors.push(`${file}:${i + 1}  var(${name}) is not defined in ${CSS_FILE}`);
      }
    });
  }
}

if (errors.length > 0) {
  console.error(`✗ ${errors.length} undefined design-token reference(s):\n`);
  for (const e of errors) console.error("  " + e);
  console.error(`\nEvery var(--x) used in app/, components/, lib/ must be defined in ${CSS_FILE}.`);
  process.exit(1);
}
console.log(
  `✓ css-vars: all var(--x) references resolve against ${CSS_FILE} (${definedVars.size} tokens)`,
);
