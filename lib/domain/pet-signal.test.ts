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
});
