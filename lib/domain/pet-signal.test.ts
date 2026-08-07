import { describe, it, expect } from "vitest";
import { computePetSignal, type HealthMetricRow } from "./pet-signal";

const NOW = new Date("2026-01-15T12:00:00Z");
const TODAY = "2026-01-15";
const YESTERDAY = "2026-01-14";

const normalDogRow: HealthMetricRow = {
  date: TODAY,
  weightGrams: 25000,           // 25 kg — normal for a medium dog
  temperatureCentidegrees: 3850, // 38.5°C — normal
  heartRateBpm: 80,             // normal
  energy: 4,
  mood: 4,
  anxiety: 1,                   // calm = good
  socialization: 4,
};

describe("computePetSignal", () => {
  it("returns healthy when all metrics are normal", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("healthy");
    expect(result.outOfRangeMetrics).toHaveLength(0);
  });

  it("returns watch with no recent metrics", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("watch");
  });

  it("returns healthy (new_pet) for a young profile with no data yet", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [],
      overdueVaccinations: 0,
      petCreatedAt: new Date(NOW.getTime() - 2 * 86400000), // 2 days old
      now: NOW,
    });
    expect(result.signal).toBe("healthy");
    expect(result.reasonData.type).toBe("new_pet");
  });

  it("still returns watch for an old profile with no data, even when createdAt is passed", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [],
      overdueVaccinations: 0,
      petCreatedAt: new Date(NOW.getTime() - 30 * 86400000),
      now: NOW,
    });
    expect(result.signal).toBe("watch");
  });

  it("overdue vaccination overrides the new-profile grace", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [],
      overdueVaccinations: 1,
      petCreatedAt: new Date(NOW.getTime() - 2 * 86400000),
      now: NOW,
    });
    expect(result.signal).toBe("concern");
  });

  it("returns watch when last log is 7+ days ago", () => {
    const staleRow: HealthMetricRow = { ...normalDogRow, date: "2026-01-07" };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [staleRow],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("watch");
  });

  it("returns watch with one out-of-range metric", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      heartRateBpm: 200, // abnormally high for a dog
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("watch");
    expect(result.outOfRangeMetrics).toContain("heart_rate");
  });

  it("returns concern with two or more out-of-range metrics", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      heartRateBpm: 200,           // out of range
      temperatureCentidegrees: 4100, // fever
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("concern");
  });

  it("escalates healthy → watch with overdue vaccination", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow],
      overdueVaccinations: 1,
      now: NOW,
    });
    expect(result.signal).toBe("watch");
  });

  it("escalates watch → concern with overdue vaccination", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      heartRateBpm: 200, // one metric out of range = watch
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 1,
      now: NOW,
    });
    expect(result.signal).toBe("concern");
  });

  it("handles null metric values gracefully", () => {
    const row: HealthMetricRow = {
      date: TODAY,
      weightGrams: null,
      temperatureCentidegrees: null,
      heartRateBpm: null,
      energy: 4,
      mood: 4,
      anxiety: 1,
      socialization: 4,
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("healthy");
  });

  it("returns concern when no metrics and overdue vaccinations present", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [],
      overdueVaccinations: 1,
      now: NOW,
    });
    expect(result.signal).toBe("concern");
    expect(result.reason).toMatch(/no health metrics/i);
  });

  it("detects high anxiety (inverted metric) as out-of-range", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      anxiety: 5, // very anxious — normal range is 1–2, so 5 is out-of-range
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.signal).toBe("watch");
    expect(result.outOfRangeMetrics).toContain("anxiety");
  });

  it("uses most recent row when multiple are provided", () => {
    const oldBadRow: HealthMetricRow = {
      ...normalDogRow,
      date: YESTERDAY,
      heartRateBpm: 200,
      temperatureCentidegrees: 4100,
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow, oldBadRow], // TODAY is better
      overdueVaccinations: 0,
      now: NOW,
    });
    // Should use TODAY (normalDogRow), not YESTERDAY
    expect(result.signal).toBe("healthy");
  });

  // ── Reason string format ──────────────────────────────────────────────────

  it("reason is 'All monitored metrics within normal range' when healthy and no overdue vaccines", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.reason).toBe("All monitored metrics within normal range");
  });

  it("reason includes metric label, display value, unit and normal range when out-of-range", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      heartRateBpm: 200, // dog normal: 60–140 bpm
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    // e.g. "Heart Rate 200bpm (normal 60–140bpm)"
    expect(result.reason).toContain("Heart Rate");
    expect(result.reason).toContain("200");
    expect(result.reason).toContain("60");
    expect(result.reason).toContain("140");
  });

  it("reason includes overdue vaccination count when only vaccines are overdue", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow],
      overdueVaccinations: 2,
      now: NOW,
    });
    expect(result.reason).toContain("2 overdue vaccinations");
  });

  it("reason includes singular 'vaccination' for exactly 1 overdue", () => {
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [normalDogRow],
      overdueVaccinations: 1,
      now: NOW,
    });
    expect(result.reason).toContain("1 overdue vaccination");
    expect(result.reason).not.toContain("vaccinations");
  });

  it("reason joins out-of-range metric details and vaccination count with ' · '", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      heartRateBpm: 200,
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 1,
      now: NOW,
    });
    // Should contain both parts joined by ' · '
    expect(result.reason).toMatch(/Heart Rate.*·.*1 overdue vaccination/);
  });

  it("reason for temperature includes °C value and normal range", () => {
    const row: HealthMetricRow = {
      ...normalDogRow,
      temperatureCentidegrees: 4100, // 41.0°C — above dog normal 38–39°C
    };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.reason).toContain("Temperature");
    expect(result.reason).toContain("41");
    expect(result.reason).toContain("°C");
  });

  it("reason for weight shows kg (not raw grams)", () => {
    // 500g is below dog minimum (1500g = 1.5 kg)
    const row: HealthMetricRow = { ...normalDogRow, weightGrams: 500 };
    const result = computePetSignal({
      species: "dog",
      recentMetrics: [row],
      overdueVaccinations: 0,
      now: NOW,
    });
    expect(result.outOfRangeMetrics).toContain("weight");
    // Display value: 0.5 kg, NOT 500 (raw grams)
    expect(result.reason).toContain("0.5kg");
    expect(result.reason).not.toContain("500kg");
    // Normal range in kg, NOT grams
    expect(result.reason).toContain("1.5");
    expect(result.reason).not.toContain("1500");
  });
});
