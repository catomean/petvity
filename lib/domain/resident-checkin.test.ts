import { describe, it, expect } from "vitest";
import { generateResidentCheckin } from "./resident-checkin";
import { RESIDENT_PETS } from "@/lib/config/resident-pet";
import { getNormalRange } from "@/lib/config/health-metrics";

const cat = RESIDENT_PETS.find((p) => p.pet.species === "cat")!.checkin;
const dog = RESIDENT_PETS.find((p) => p.pet.species === "dog")!.checkin;

function datesOfYear(year: number): string[] {
  return Array.from({ length: 365 }, (_, i) =>
    new Date(Date.UTC(year, 0, 1 + i)).toISOString().slice(0, 10),
  );
}

describe("generateResidentCheckin", () => {
  it("is deterministic for a given date and profile", () => {
    expect(generateResidentCheckin("2026-08-08", cat)).toEqual(
      generateResidentCheckin("2026-08-08", cat),
    );
  });

  it("differs between days", () => {
    const a = generateResidentCheckin("2026-08-08", cat);
    const b = generateResidentCheckin("2026-08-09", cat);
    expect(a).not.toEqual(b);
  });

  it("differs between pets on the same day", () => {
    const a = generateResidentCheckin("2026-08-08", cat);
    const b = generateResidentCheckin("2026-08-08", dog);
    expect(a).not.toEqual(b);
  });

  it.each([
    ["cat", cat],
    ["dog", dog],
  ] as const)(
    "stays inside %s physical normal ranges across a full year",
    (species, profile) => {
      const weight = getNormalRange("weight", species);
      const temp = getNormalRange("temperature", species);
      const hr = getNormalRange("heart_rate", species);
      for (const date of datesOfYear(2026)) {
        const c = generateResidentCheckin(date, profile);
        expect(c.weightGrams).toBeGreaterThanOrEqual(weight.min);
        expect(c.weightGrams).toBeLessThanOrEqual(weight.max);
        expect(c.temperatureCentidegrees).toBeGreaterThanOrEqual(temp.min);
        expect(c.temperatureCentidegrees).toBeLessThanOrEqual(temp.max);
        expect(c.heartRateBpm).toBeGreaterThanOrEqual(hr.min);
        expect(c.heartRateBpm).toBeLessThanOrEqual(hr.max);
        for (const k of ["energy", "mood", "anxiety", "socialization"] as const) {
          expect(c[k]).toBeGreaterThanOrEqual(1);
          expect(c[k]).toBeLessThanOrEqual(5);
        }
      }
    },
  );

  it.each([
    ["cat", cat],
    ["dog", dog],
  ] as const)("produces occasional anxious days but mostly calm ones (%s)", (_species, profile) => {
    let anxious = 0;
    for (const date of datesOfYear(2026)) {
      if (generateResidentCheckin(date, profile).anxiety >= 4) anxious++;
    }
    expect(anxious).toBeGreaterThan(10);
    expect(anxious).toBeLessThan(80);
  });
});
