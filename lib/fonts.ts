import { Plus_Jakarta_Sans, Jost, IBM_Plex_Mono } from "next/font/google";

/** SSOT for the app's font faces. Both root layout and the [locale] layout
 *  render their own <html>, so both must carry these variable classes —
 *  import `fontVariables` rather than redeclaring the fonts. */

// Body — everywhere.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Luxury-futurist display face — ultra-light geometric (Futura lineage) for
// the obsidian marketing surface. Large sizes carry the thin weights.
const display = Jost({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["200", "300", "400"],
});

// Instrument mono — eyebrows, data labels, telemetry-style details.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const fontVariables = `${sans.variable} ${display.variable} ${mono.variable}`;
