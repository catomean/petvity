import { describe, it, expect } from "vitest";
import { computeDigitalTwin } from "./digital-twin";

const NOW = new Date("2026-01-15T12:00:00Z");
const TODAY = "2026-01-15";
const YESTERDAY = "2026-01-14";

describe("computeDigitalTwin", () => {
  it("returns no_data when latest is null", () => {
    const result = computeDigitalTwin(null, NOW);
    expect(result.id).toBe("no_data");
    expect(result.daysAgo).toBeNull();
    expect(result.metrics).toHaveLength(0);
  });

  it("returns thriving for all-high positive metrics and low anxiety", () => {
    const result = computeDigitalTwin(
      { date: TODAY, mood: 5, energy: 5, anxiety: 1, socialization: 5 },
      NOW,
    );
    expect(result.id).toBe("thriving");
    expect(result.scorePercent).toBe(100);
    expect(result.daysAgo).toBe(0);
  });

  it("returns struggling for all-low positive metrics and high anxiety", () => {
    const result = computeDigitalTwin(
      { date: TODAY, mood: 1, energy: 1, anxiety: 5, socialization: 1 },
      NOW,
    );
    expect(result.id).toBe("struggling");
    expect(result.scorePercent).toBe(0);
  });

  it("inverts anxiety — anxiety=1 contributes max score", () => {
    // Only anxiety logged, value 1 (calmest) → fill 100%
    const result = computeDigitalTwin(
      { date: TODAY, mood: null, energy: null, anxiety: 1, socialization: null },
      NOW,
    );
    const anxietyMetric = result.metrics.find((m) => m.id === "anxiety");
    expect(anxietyMetric?.fillPercent).toBe(100);
    expect(anxietyMetric?.label).toBe("Calm");
  });

  it("inverts anxiety — anxiety=5 contributes zero score", () => {
    const result = computeDigitalTwin(
      { date: TODAY, mood: null, energy: null, anxiety: 5, socialization: null },
      NOW,
    );
    const anxietyMetric = result.metrics.find((m) => m.id === "anxiety");
    expect(anxietyMetric?.fillPercent).toBe(0);
  });

  it("computes correct daysAgo for yesterday's data", () => {
    const result = computeDigitalTwin(
      { date: YESTERDAY, mood: 4, energy: 4, anxiety: 2, socialization: 4 },
      NOW,
    );
    expect(result.daysAgo).toBe(1);
  });

  it("only includes metrics with non-null values", () => {
    const result = computeDigitalTwin(
      { date: TODAY, mood: 4, energy: null, anxiety: null, socialization: 3 },
      NOW,
    );
    expect(result.metrics).toHaveLength(2);
    expect(result.metrics.map((m) => m.id).sort()).toEqual(["mood", "socialization"]);
  });

  it("returns content for mid-range metrics", () => {
    const result = computeDigitalTwin(
      { date: TODAY, mood: 3, energy: 3, anxiety: 3, socialization: 3 },
      NOW,
    );
    // anxiety=3 → score=(5-3)/4*100=50; mood/energy/social=(3-1)/4*100=50; avg=50
    expect(result.scorePercent).toBe(50);
    expect(result.id).toBe("content");
  });
});
