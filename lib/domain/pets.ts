import { SPECIES_CONFIG, type SpeciesId } from "@/lib/config/species";

/**
 * Generate a URL-safe handle from a pet name.
 * e.g. "Mochi the Shiba" → "mochi-the-shiba"
 */
export function createPetHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

/**
 * Check whether a breed name is valid for a given species.
 * Always returns true for "Mixed / Other" and "Other".
 */
export function validateSpeciesBreed(
  speciesId: SpeciesId,
  breed: string,
): boolean {
  if (!breed || breed === "Other" || breed === "Mixed / Other") return true;
  const def = SPECIES_CONFIG[speciesId];
  if (!def) return false;
  return def.commonBreeds.includes(breed);
}
