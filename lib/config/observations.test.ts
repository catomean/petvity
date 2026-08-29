import { describe, it, expect } from "vitest";
import {
  OBSERVATIONS,
  PET_RECORDS,
  DAILY_LIMIT,
  observationsFor,
  dailyObservationsFor,
  dailyOwnerObservationsFor,
  dailyDeviceObservationsFor,
  tierFor,
  redFlagsFor,
  observationById,
  recordsFor,
} from "./observations";
import { SPECIES_CONFIG } from "./species";
import type { SpeciesId } from "./species";

const ALL_SPECIES = Object.keys(SPECIES_CONFIG) as SpeciesId[];

describe("catalogue integrity", () => {
  it("has unique ids", () => {
    const ids = OBSERVATIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names only species that exist", () => {
    const unknown = OBSERVATIONS.flatMap((o) =>
      o.species.filter((s) => !ALL_SPECIES.includes(s)).map((s) => `${o.id}:${s}`),
    );
    expect(unknown).toEqual([]);
  });

  it("applies every observation to at least one species", () => {
    // An observation nobody is asked is dead config that still has to be read.
    expect(OBSERVATIONS.filter((o) => o.species.length === 0).map((o) => o.id)).toEqual([]);
  });

  it("gives every observation a reason to exist", () => {
    expect(OBSERVATIONS.filter((o) => o.why.trim().length < 20).map((o) => o.id)).toEqual([]);
  });

  it("phrases every observation as a question to the owner", () => {
    expect(OBSERVATIONS.filter((o) => o.question.trim().length === 0).map((o) => o.id)).toEqual([]);
  });

  it("gives choice observations their choices, and nothing else choices", () => {
    for (const o of OBSERVATIONS) {
      if (o.kind === "choice") expect(o.choices?.length, o.id).toBeGreaterThan(1);
      else expect(o.choices, o.id).toBeUndefined();
    }
  });

  it("explains every red flag", () => {
    // An alert an owner cannot act on, or does not believe, gets dismissed —
    // and then so does the next one.
    const unexplained = OBSERVATIONS.flatMap((o) =>
      (o.redFlags ?? []).filter((f) => f.because.trim().length < 20).map(() => o.id),
    );
    expect(unexplained).toEqual([]);
  });
});

describe("ectotherms are not asked for a body temperature", () => {
  // The defect this whole file exists to prevent: fish and reptiles do not have
  // a body temperature independent of their environment, so any observation
  // implying otherwise is meaningless data collection.
  it("asks fish about water, not about themselves", () => {
    const fishIds = observationsFor("fish").map((o) => o.id);
    expect(fishIds).toContain("water_temp");
    expect(fishIds).not.toContain("temperature");
    expect(fishIds).not.toContain("heart_rate");
  });

  it("asks reptiles about the enclosure gradient", () => {
    const ids = observationsFor("reptile").map((o) => o.id);
    expect(ids).toContain("enclosure_warm_temp");
    expect(ids).toContain("enclosure_cool_temp");
    expect(ids).not.toContain("temperature");
  });
});

describe("the daily set stays small enough to actually be filled in", () => {
  for (const species of ALL_SPECIES) {
    it(`${species} is asked at most ${DAILY_LIMIT} things a day`, () => {
      // Asserted rather than enforced by truncation: if this fails, a person
      // decides what to demote. Slicing silently would let a new observation
      // push a more important one out of the owner's day unnoticed.
      const daily = dailyObservationsFor(species);
      expect(daily.map((o) => o.id).join(", "), species).toBeDefined();
      expect(daily.length, `${species} daily set`).toBeLessThanOrEqual(DAILY_LIMIT);
    });
  }

  it("gives every species something to check daily", () => {
    // Fish once had an empty daily check-in, because water temperature is read
    // off a thermometer and device readings were being filtered out. For an
    // ectotherm that reading IS the daily health check.
    for (const species of ALL_SPECIES) {
      expect(dailyObservationsFor(species).length, `${species} has nothing daily`).toBeGreaterThan(
        0,
      );
    }
  });

  it("never asks the owner unaided for a device reading", () => {
    for (const species of ALL_SPECIES) {
      const bad = dailyOwnerObservationsFor(species).filter((o) => o.source !== "owner");
      expect(
        bad.map((o) => o.id),
        species,
      ).toEqual([]);
    }
  });

  it("splits the daily set into what is observed and what is measured", () => {
    for (const species of ALL_SPECIES) {
      const total = dailyObservationsFor(species).length;
      const parts =
        dailyOwnerObservationsFor(species).length + dailyDeviceObservationsFor(species).length;
      expect(parts, species).toBe(total);
    }
  });

  it("orders the daily set by explicit priority, not by position in the file", () => {
    for (const species of ALL_SPECIES) {
      const p = dailyObservationsFor(species).map((o) => o.priority);
      expect(p, species).toEqual([...p].sort((a, b) => a - b));
    }
  });

  it("gives every species that a person keeps something to log", () => {
    for (const species of ALL_SPECIES) {
      expect(observationsFor(species).length, species).toBeGreaterThan(0);
    }
  });
});

describe("cadence is per species where the default would be wrong", () => {
  it("does not ask a snake keeper whether it ate today", () => {
    // Many reptiles are fed weekly or less. A daily feeding question trains
    // the owner to answer "no" meaninglessly 6 days out of 7.
    const appetite = observationById("appetite")!;
    expect(tierFor(appetite, "reptile")).toBe("periodic");
    expect(tierFor(appetite, "rabbit")).toBe("daily");
  });

  it("asks a horse owner about movement every day", () => {
    const lameness = observationById("lameness")!;
    expect(tierFor(lameness, "horse")).toBe("daily");
    expect(tierFor(lameness, "dog")).toBe("periodic");
  });

  it("puts the enclosure in front of a reptile keeper daily", () => {
    const ids = dailyObservationsFor("reptile").map((o) => o.id);
    expect(ids).toContain("enclosure_warm_temp");
    expect(ids).toContain("enclosure_cool_temp");
  });

  it("puts the water in front of a fish keeper daily", () => {
    expect(dailyObservationsFor("fish").map((o) => o.id)).toContain("water_temp");
  });
});

describe("the signals that actually kill these animals are covered", () => {
  it("watches rabbits and guinea pigs for gut stasis", () => {
    for (const species of ["rabbit", "guinea_pig"] as SpeciesId[]) {
      const ids = observationsFor(species).map((o) => o.id);
      expect(ids, species).toContain("appetite");
      expect(ids, species).toContain("stool");
      const emergencies = redFlagsFor(species).filter((f) => f.urgency === "emergency");
      expect(emergencies.length, species).toBeGreaterThan(0);
    }
  });

  it("watches male cats for urinary blockage", () => {
    const flags = redFlagsFor("cat");
    expect(flags.some((f) => f.urgency === "emergency" && /urin|strain/i.test(f.when))).toBe(true);
  });

  it("weighs birds and small rodents daily", () => {
    for (const species of ["bird", "hamster", "guinea_pig"] as SpeciesId[]) {
      expect(
        dailyObservationsFor(species).map((o) => o.id),
        species,
      ).toContain("weight_small");
    }
  });

  it("watches horses for colic", () => {
    const flags = redFlagsFor("horse");
    expect(flags.some((f) => f.urgency === "emergency")).toBe(true);
    expect(observationsFor("horse").map((o) => o.id)).toContain("manure_output");
  });

  it("reminds reptile keepers about UVB decay", () => {
    expect(observationsFor("reptile").map((o) => o.id)).toContain("uvb_bulb_age");
  });

  it("keeps guinea pigs on vitamin C", () => {
    // They cannot synthesise it; this one is species-unique and easy to forget.
    expect(observationsFor("guinea_pig").map((o) => o.id)).toContain("vitamin_c");
    expect(observationsFor("rabbit").map((o) => o.id)).not.toContain("vitamin_c");
  });

  it("tests fish water for ammonia and nitrite", () => {
    const ids = observationsFor("fish").map((o) => o.id);
    expect(ids).toContain("ammonia");
    expect(ids).toContain("nitrite");
  });
});

describe("records", () => {
  it("has unique ids", () => {
    const ids = PET_RECORDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asks almost nothing during onboarding", () => {
    // Onboarding is where owners are lost. Everything that can wait, waits.
    const atOnboarding = PET_RECORDS.filter((r) => r.askAt === "onboarding");
    expect(atOnboarding.length).toBeLessThanOrEqual(2);
  });

  it("records a microchip for the species that carry one", () => {
    expect(recordsFor("dog").map((r) => r.id)).toContain("microchip");
    expect(recordsFor("fish").map((r) => r.id)).not.toContain("microchip");
  });

  it("marks recurring records as recurring so they can be reminded", () => {
    const parasite = PET_RECORDS.find((r) => r.id === "parasite_prevention");
    expect(parasite?.recurring).toBe(true);
  });
});

describe("lookup helpers", () => {
  it("finds an observation by id", () => {
    expect(observationById("appetite")?.label).toBe("Appetite");
  });

  it("returns undefined rather than throwing for an unknown id", () => {
    expect(observationById("does_not_exist")).toBeUndefined();
  });
});
