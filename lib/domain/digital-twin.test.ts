import { describe, it, expect } from "vitest";
import { computeDigitalTwin } from "./digital-twin";
import type { HealthMetricRow } from "./pet-signal";

const NOW = new Date("2026-01-15T12:00:00Z");
const TODAY     = "2026-01-15";
const YESTERDAY = "2026-01-14";
const DAY2      = "2026-01-13";
const DAY3      = "2026-01-12";

function row(date: string, overrides: Partial<Pick<HealthMetricRow, "mood" | "energy" | "anxiety" | "socialization">> = {}): HealthMetricRow {
  return {
    date,
    weightGrams: null,
    temperatureCentidegrees: null,
    heartRateBpm: null,
    mood: null,
    energy: null,
    anxiety: null,
    socialization: null,
    ...overrides,
  };
}

describe("computeDigitalTwin", () => {
  it("returns no_data when array is empty", () => {
    const result = computeDigitalTwin([], NOW);
    expect(result.id).toBe("no_data");
    expect(result.daysAgo).toBeNull();
    expect(result.metrics).toHaveLength(0);
    expect(result.trend).toBe("insufficient_data");
  });

  it("returns thriving for all-high positive metrics and low anxiety", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { mood: 5, energy: 5, anxiety: 1, socialization: 5 })],
      NOW,
    );
    expect(result.id).toBe("thriving");
    expect(result.scorePercent).toBe(100);
    expect(result.daysAgo).toBe(0);
  });

  it("returns struggling for all-low positive metrics and high anxiety", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { mood: 1, energy: 1, anxiety: 5, socialization: 1 })],
      NOW,
    );
    expect(result.id).toBe("struggling");
    expect(result.scorePercent).toBe(0);
  });

  it("inverts anxiety — anxiety=1 contributes 100% fill", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { anxiety: 1 })],
      NOW,
    );
    const m = result.metrics.find((x) => x.id === "anxiety");
    expect(m?.fillPercent).toBe(100);
  });

  it("inverts anxiety — anxiety=5 contributes 0% fill", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { anxiety: 5 })],
      NOW,
    );
    const m = result.metrics.find((x) => x.id === "anxiety");
    expect(m?.fillPercent).toBe(0);
  });

  it("computes correct daysAgo for yesterday's data", () => {
    const result = computeDigitalTwin(
      [row(YESTERDAY, { mood: 4, energy: 4, anxiety: 2, socialization: 4 })],
      NOW,
    );
    expect(result.daysAgo).toBe(1);
  });

  it("only includes metrics with non-null values", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { mood: 4, socialization: 3 })],
      NOW,
    );
    expect(result.metrics).toHaveLength(2);
    expect(result.metrics.map((m) => m.id).sort()).toEqual(["mood", "socialization"]);
  });

  it("returns content for mid-range metrics (score=50)", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { mood: 3, energy: 3, anxiety: 3, socialization: 3 })],
      NOW,
    );
    // mood/energy/social: (3-1)/4*100=50; anxiety: (5-3)/4*100=50 → avg=50
    expect(result.scorePercent).toBe(50);
    expect(result.id).toBe("content");
  });

  it("returns insufficient_data trend for single row", () => {
    const result = computeDigitalTwin(
      [row(TODAY, { mood: 4, energy: 4 })],
      NOW,
    );
    expect(result.trend).toBe("insufficient_data");
  });

  it("detects improving trend when recent scores are higher", () => {
    // Recent: days 0–1 (mood=5 = score 100), Prior: days 2–3 (mood=1 = score 0)
    const result = computeDigitalTwin(
      [
        row(TODAY,     { mood: 5 }),
        row(YESTERDAY, { mood: 5 }),
        row(DAY2,      { mood: 1 }),
        row(DAY3,      { mood: 1 }),
      ],
      NOW,
    );
    expect(result.trend).toBe("improving");
    expect(result.trendDelta).toBeGreaterThan(0);
  });

  it("detects declining trend when recent scores are lower", () => {
    const result = computeDigitalTwin(
      [
        row(TODAY,     { mood: 1 }),
        row(YESTERDAY, { mood: 1 }),
        row(DAY2,      { mood: 5 }),
        row(DAY3,      { mood: 5 }),
      ],
      NOW,
    );
    expect(result.trend).toBe("declining");
    expect(result.trendDelta).toBeLessThan(0);
  });

  it("detects stable trend when scores are similar", () => {
    const result = computeDigitalTwin(
      [
        row(TODAY,     { mood: 3, energy: 3 }),
        row(YESTERDAY, { mood: 3, energy: 3 }),
        row(DAY2,      { mood: 3, energy: 3 }),
        row(DAY3,      { mood: 3, energy: 3 }),
      ],
      NOW,
    );
    expect(result.trend).toBe("stable");
    expect(result.trendDelta).toBe(0);
  });

  it("handles two rows — trend from splitting into one each", () => {
    const result = computeDigitalTwin(
      [
        row(TODAY,     { mood: 5 }),
        row(YESTERDAY, { mood: 1 }),
      ],
      NOW,
    );
    // recent=[today=100], prior=[yesterday=0] → delta=100 → improving
    expect(result.trend).toBe("improving");
  });
});
