import localFont from "next/font/local";

/** SSOT for the app's font faces. Both root layout and the [locale] layout
 *  render their own <html>, so both must carry these variable classes —
 *  import `fontVariables` rather than redeclaring the fonts.
 *
 *  The files are vendored in ./font-files rather than fetched by
 *  next/font/google, which downloaded them from fonts.gstatic.com **at build
 *  time**. That put Google on the critical path of every CI run and every
 *  deploy: it failed twice in one week with a module-not-found on the generated
 *  @font-face, blocking a merge each time, and a build that only works when a
 *  third party is reachable cannot be trusted to ship an urgent fix.
 *
 *  Only the `latin` subset is vendored, matching the previous
 *  `subsets: ["latin"]` exactly — the non-latin locales (ja/zh/ko/ar, and the
 *  Turkish latin-ext glyphs) fell back to system faces before and still do.
 *
 *  To refresh or add a weight: edit scripts/fetch-fonts.mjs, run it, commit the
 *  .woff2. It is deliberately not wired into the build — that would reintroduce
 *  the network dependency this removes. */

// Body — everywhere. Variable font, 400–800.
const sans = localFont({
  src: "./font-files/PlusJakartaSans-latin.woff2",
  weight: "400 800",
  variable: "--font-sans",
  display: "swap",
});

// Luxury-futurist display face — ultra-light geometric (Futura lineage) for
// the obsidian marketing surface. Large sizes carry the thin weights.
// Variable font, 200–400.
const display = localFont({
  src: "./font-files/Jost-latin.woff2",
  weight: "200 400",
  variable: "--font-display",
  display: "swap",
});

// Instrument mono — eyebrows, data labels, telemetry-style details.
// Static weights; IBM Plex Mono ships no variable axis.
const mono = localFont({
  src: [
    { path: "./font-files/IBMPlexMono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./font-files/IBMPlexMono-500-latin.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${sans.variable} ${display.variable} ${mono.variable}`;
