#!/usr/bin/env node
/**
 * Download the self-hosted font files into lib/font-files/.
 *
 * The build used to fetch these from fonts.gstatic.com at build time via
 * next/font/google, which made every CI build and every deploy depend on
 * Google being reachable — it failed twice in one week, blocking a merge each
 * time. Vendoring the files makes the build hermetic.
 *
 * Run this only to refresh a face (new weight, new family, upstream version
 * bump), then commit the .woff2 files. It is not part of build or CI — if it
 * were, the network dependency would be right back.
 *
 * Usage: node scripts/fetch-fonts.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "font-files");

// A modern UA is required or Google serves ttf instead of woff2.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Weight ranges mirror lib/fonts.ts exactly. Only the `latin` subset is taken,
 * matching the previous `subsets: ["latin"]` — widening it here would silently
 * change which glyphs render in the webfont versus the system fallback.
 */
const FACES = [
  { file: "PlusJakartaSans-latin.woff2", query: "Plus+Jakarta+Sans:wght@400..800" },
  { file: "Jost-latin.woff2", query: "Jost:wght@200..400" },
  { file: "IBMPlexMono-400-latin.woff2", query: "IBM+Plex+Mono:wght@400", weight: "400" },
  { file: "IBMPlexMono-500-latin.woff2", query: "IBM+Plex+Mono:wght@500", weight: "500" },
];

/** Pull the src URL out of the @font-face block commented `/* latin *​/`. */
function latinUrl(css) {
  const blocks = css.split("@font-face").slice(1);
  for (const [i, block] of blocks.entries()) {
    // The subset name is in the comment *preceding* the block.
    const before = css.split("@font-face")[i];
    const label = [...before.matchAll(/\/\*\s*([a-z-]+)\s*\*\//g)].pop()?.[1];
    if (label !== "latin") continue;
    const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (url) return url;
  }
  throw new Error("no latin subset found");
}

/** curl, not fetch — node's fetch has no route to gstatic in some sandboxes. */
const get = (url, binary = false) =>
  execFileSync("curl", ["-sSfL", "-A", UA, url], {
    encoding: binary ? "buffer" : "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

await mkdir(OUT, { recursive: true });

for (const face of FACES) {
  const css = get(`https://fonts.googleapis.com/css2?family=${face.query}&display=swap`);
  const url = latinUrl(css);
  const bytes = get(url, true);
  await writeFile(join(OUT, face.file), bytes);
  console.log(`${face.file.padEnd(32)} ${(bytes.length / 1024).toFixed(1)} KB  ${url}`);
}
