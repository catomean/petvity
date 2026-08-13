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

export const GROOMER_SERVICES = [
  { value: "bath_brush",     label: "Bath & Brush" },
  { value: "full_groom",     label: "Full Groom" },
  { value: "haircut",        label: "Haircut & Styling" },
  { value: "deshedding",     label: "De-shedding" },
  { value: "nail_trim",      label: "Nail Trim" },
  { value: "teeth_cleaning", label: "Teeth Cleaning" },
] as const;

export type GroomerServiceId = (typeof GROOMER_SERVICES)[number]["value"];

