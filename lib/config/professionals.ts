/**
 * SSOT for vet and sitter profile config.
 * Used by professional profile form, find page, and public pro profiles.
 */

export const SITTER_SERVICES = [
  { value: "boarding",      label: "Boarding" },
  { value: "daycare",       label: "Daycare" },
  { value: "walking",       label: "Dog Walking" },
  { value: "house_sitting", label: "House Sitting" },
  { value: "drop_in",       label: "Drop-in Visits" },
] as const;

export type SitterServiceId = (typeof SITTER_SERVICES)[number]["value"];

