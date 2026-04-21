export type SpeciesId = "dog" | "cat" | "horse" | "other";

export type SpeciesDef = {
  id: SpeciesId;
  label: string;
  emoji: string;
  typicalLifespanYears: { min: number; max: number };
  commonBreeds: string[];
  /** Normal temperature range in centidegrees (1°C = 100 units). e.g. 3850 = 38.50°C */
  temperatureNormal: { min: number; max: number };
  /** Normal resting heart rate in bpm */
  heartRateNormal: { min: number; max: number };
  /** Normal weight range in grams */
  weightNormal: { min: number; max: number };
};

export const SPECIES_CONFIG: Record<SpeciesId, SpeciesDef> = {
  dog: {
    id: "dog",
    label: "Dog",
    emoji: "🐕",
    typicalLifespanYears: { min: 10, max: 15 },
    commonBreeds: [
      "Labrador Retriever",
      "German Shepherd",
      "Golden Retriever",
      "French Bulldog",
      "Bulldog",
      "Poodle",
      "Beagle",
      "Rottweiler",
      "Yorkshire Terrier",
      "Dachshund",
      "Siberian Husky",
      "Boxer",
      "Great Dane",
      "Chihuahua",
      "Mixed / Other",
    ],
    temperatureNormal: { min: 3800, max: 3900 },
    heartRateNormal: { min: 60, max: 140 },
    weightNormal: { min: 1500, max: 90000 },
  },
  cat: {
    id: "cat",
    label: "Cat",
    emoji: "🐈",
    typicalLifespanYears: { min: 12, max: 18 },
    commonBreeds: [
      "Domestic Shorthair",
      "Domestic Longhair",
      "Maine Coon",
      "Persian",
      "Siamese",
      "Ragdoll",
      "Bengal",
      "Sphynx",
      "British Shorthair",
      "Abyssinian",
      "Scottish Fold",
      "Mixed / Other",
    ],
    temperatureNormal: { min: 3800, max: 3925 },
    heartRateNormal: { min: 120, max: 220 },
    weightNormal: { min: 2500, max: 8000 },
  },
  horse: {
    id: "horse",
    label: "Horse",
    emoji: "🐴",
    typicalLifespanYears: { min: 25, max: 35 },
    commonBreeds: [
      "Thoroughbred",
      "Quarter Horse",
      "Arabian",
      "Warmblood",
      "Appaloosa",
      "Paint Horse",
      "Clydesdale",
      "Friesian",
      "Andalusian",
      "Other",
    ],
    temperatureNormal: { min: 3750, max: 3850 },
    heartRateNormal: { min: 28, max: 44 },
    weightNormal: { min: 380000, max: 1200000 },
  },
  other: {
    id: "other",
    label: "Other",
    emoji: "🐾",
    typicalLifespanYears: { min: 1, max: 30 },
    commonBreeds: ["Other"],
    temperatureNormal: { min: 3500, max: 4000 },
    heartRateNormal: { min: 40, max: 300 },
    weightNormal: { min: 10, max: 100000 },
  },
};

/** Ordered species list for UI selects. */
export const SPECIES_OPTIONS = Object.values(SPECIES_CONFIG).map(
  ({ id, label, emoji }) => ({ value: id, label: `${emoji} ${label}` }),
);

/** Get breeds for a given species as select options. */
export function getBreedOptions(
  speciesId: SpeciesId,
): { value: string; label: string }[] {
  return (SPECIES_CONFIG[speciesId]?.commonBreeds ?? []).map((b) => ({
    value: b,
    label: b,
  }));
}
