/**
 * A professional or seller is only listed publicly once their profile can
 * actually serve a customer. This is the difference between a directory of
 * real businesses and a directory of empty shells — and it is the same rule
 * for everyone, enforced in the listing queries, not by hand-curation.
 */

export interface ProfileStep {
  key: string;
  done: boolean;
}

export type ProfileKind = "veterinarian" | "pet_sitter" | "groomer" | "seller";

type Fields = Record<string, unknown>;

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return true;
  return Boolean(v);
}

/**
 * Steps required before a profile goes live, per kind. The first three are
 * what a customer needs to decide; `accepting` is the pro's own switch.
 */
export function profileSteps(kind: ProfileKind, p: Fields): ProfileStep[] {
  const common = [
    { key: "location", done: filled(p.city) && filled(p.country) },
    { key: "bio", done: typeof p.bio === "string" && p.bio.trim().length >= 40 },
  ];

  if (kind === "veterinarian") {
    return [
      { key: "clinic", done: filled(p.clinicName) },
      { key: "specialty", done: filled(p.specialty) },
      ...common,
      { key: "contact", done: filled(p.phone) },
      { key: "accepting", done: p.isAcceptingClients === true },
    ];
  }
  if (kind === "pet_sitter") {
    return [
      { key: "services", done: typeof p.services === "string" && p.services.trim().length > 0 },
      { key: "price", done: typeof p.pricePerDay === "number" && p.pricePerDay > 0 },
      ...common,
      { key: "contact", done: filled(p.phone) },
      { key: "accepting", done: p.isAcceptingClients === true },
    ];
  }
  if (kind === "groomer") {
    return [
      { key: "salon", done: filled(p.salonName) },
      { key: "services", done: typeof p.services === "string" && p.services.trim().length > 0 },
      { key: "price", done: typeof p.priceFrom === "number" && p.priceFrom > 0 },
      ...common,
      { key: "contact", done: filled(p.phone) },
      { key: "accepting", done: p.isAcceptingClients === true },
    ];
  }
  // seller
  return [
    { key: "storeName", done: filled(p.displayName) },
    { key: "bio", done: typeof p.bio === "string" && p.bio.trim().length >= 40 },
    { key: "location", done: filled(p.city) && filled(p.country) },
    { key: "product", done: typeof p.productCount === "number" && p.productCount > 0 },
  ];
}

/** Fraction 0–1 of required steps completed. */
export function profileProgress(steps: ProfileStep[]): number {
  if (steps.length === 0) return 0;
  return steps.filter((s) => s.done).length / steps.length;
}

/** A profile is publicly listed only when every step is done. */
export function isProfileLive(steps: ProfileStep[]): boolean {
  return steps.every((s) => s.done);
}
