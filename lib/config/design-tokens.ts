/**
 * Design token hex values for use in JS rendering contexts that cannot
 * read CSS custom properties (Satori OG images, Recharts SVG attributes).
 *
 * MUST be kept in sync with the CSS variables in app/globals.css.
 * When changing a color: update both this file and globals.css.
 */
export const TOKENS = {
  /* Brand */
  teal: "#0D6E78",
  tealDark: "#0A5860",
  tealLight: "#E3F4F6",
  tealMid: "#B2DDE2",
  tealWash: "#f0fafb",

  /* Accent */
  accent: "#B8502A",
  accentDark: "#9E4220",
  accentLight: "#FEF0E8",

  /* Secondary (sitter / feminine brand) */
  secondary: "#EC4899",
  secondaryDark: "#BE185D",
  secondaryBg: "#FDF2F8",

  /* Info */
  info: "#2563EB",
  infoBg: "#EFF6FF",

  /* Digital twin identity */
  twin: "#7C3AED",
  twinBg: "#EDE9FE",

  /* State colors */
  green: "#16A34A",
  greenBg: "#DCFCE7",
  greenText: "#166534",
  greenBorder: "#bbf7d0",
  warn: "#D97706",
  warnBg: "#FEF3C7",
  warnText: "#92400E",
  warnBorder: "#fde68a",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
  dangerDark: "#B91C1C",
  dangerBorder: "#fca5a5",

  /* Star rating */
  star: "#FBBF24",

  /* Text */
  ink: "#1C1917",
  ink2: "#44403C",
  muted: "#78716C",
  faint: "#C4BBB3",

  /* Obsidian luxury layer (marketing surface) */
  obsidian: "#08080A",
  obsidianDeep: "#050506",
  carbon: "#0F0F13",
  onyx: "#131318",
  hairline: "#26262C",
  hairlineSoft: "#1B1B20",
  platinum: "#ECE9E2",
  platinumDim: "#B6B3AC",
  mistDark: "#86847E",
  champagne: "#C9B586",
  champagneBright: "#E3D2A9",
  champagneDim: "#8F7F5B",

  /* Backgrounds */
  off: "#FAF8F5",
  light: "#F0EBE3",
  card: "#FFFFFF",
  border: "#E8E2D9",
  borderHover: "#d4cdc5",
  warmBg: "#FFFBEB",
  warmText: "#B45309",
} as const;

export type DesignToken = keyof typeof TOKENS;
