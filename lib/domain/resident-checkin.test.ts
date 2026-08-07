import { describe, it, expect } from "vitest";
import { generateResidentCheckin } from "./resident-checkin";
import { getNormalRange } from "@/lib/config/health-metrics";

describe("generateResidentCheckin", () => {
  it("is deterministic for a given date", () => {
    expect(generateResidentCheckin("2026-08-08")).toEqual(generateResidentCheckin("2026-08-08"));
  });

  it("differs between days", () => {
    const a = generateResidentCheckin("2026-08-08");
    const b = generateResidentCheckin("2026-08-09");
    expect(a).not.toEqual(b);
  });

  it("stays inside cat physical normal ranges across a full year", () => {
    const weight = getNormalRange("weight", "cat");
    const temp = getNormalRange("temperature", "cat");
    const hr = getNormalRange("heart_rate", "cat");
    for (let i = 0; i < 365; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      const c = generateResidentCheckin(date);
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
  });

  it("produces occasional anxious days but mostly calm ones", () => {
    let anxious = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      if (generateResidentCheckin(date).anxiety >= 4) anxious++;
    }
    expect(anxious).toBeGreaterThan(10);
    expect(anxious).toBeLessThan(80);
  });
});
