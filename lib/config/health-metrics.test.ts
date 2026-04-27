import { describe, it, expect } from "vitest";
import {
  HEALTH_METRIC_CONFIG,
  getNormalRange,
  isMetricInRange,
  signalFromOutOfRangeCount,
  PHYSICAL_METRICS,
  EMOTIONAL_METRICS,
} from "./health-metrics";

describe("getNormalRange", () => {
  it("returns the species-specific range when one exists", () => {
    const r = getNormalRange("weight", "dog");
    expect(r).toEqual({ min: 1500, max: 90000 }); // 1.5 kg – 90 kg in grams
  });

  it("falls back to the default range when species has no specific entry", () => {
    // 'fish' has no entry for heart_rate (table only has dog/cat/horse/...)
    const r = getNormalRange("heart_rate", "fish");
    const def = HEALTH_METRIC_CONFIG.heart_rate.normalRange.default;
    expect(r).toEqual(def);
  });

  it("returns each emotional metric's default range (no per-species variant)", () => {
    expect(getNormalRange("energy", "dog")).toEqual({ min: 3, max: 5 });
    expect(getNormalRange("mood", "cat")).toEqual({ min: 3, max: 5 });
    // anxiety inverts: lower is better, "in range" means 1–2
    expect(getNormalRange("anxiety", "horse")).toEqual({ min: 1, max: 2 });
  });
});

describe("isMetricInRange", () => {
  it("treats both endpoints as in-range (inclusive)", () => {
    expect(isMetricInRange("weight", 1500, "dog")).toBe(true);  // exact min
    expect(isMetricInRange("weight", 90000, "dog")).toBe(true); // exact max
  });

  it("returns false for values just outside the range", () => {
    expect(isMetricInRange("weight", 1499, "dog")).toBe(false);
    expect(isMetricInRange("weight", 90001, "dog")).toBe(false);
  });

  it("uses species-specific range when checking (cat weight ≠ dog weight)", () => {
    // 50 kg is fine for a Saint Bernard, off the chart for a cat
    expect(isMetricInRange("weight", 50000, "dog")).toBe(true);
    expect(isMetricInRange("weight", 50000, "cat")).toBe(false);
  });
});

describe("signalFromOutOfRangeCount", () => {
  it("0 → healthy", () => {
    expect(signalFromOutOfRangeCount(0)).toBe("healthy");
  });
  it("1 → watch", () => {
    expect(signalFromOutOfRangeCount(1)).toBe("watch");
  });
  it("2 → concern", () => {
    expect(signalFromOutOfRangeCount(2)).toBe("concern");
  });
  it("more than 2 stays at concern (no escalation level beyond)", () => {
    expect(signalFromOutOfRangeCount(7)).toBe("concern");
  });
});

describe("toDisplay / toStorage round-trips", () => {
  it("weight: 3.5 kg ↔ 3500 g (integer storage)", () => {
    const w = HEALTH_METRIC_CONFIG.weight;
    expect(w.toStorage(3.5)).toBe(3500);
    expect(w.toDisplay(3500)).toBe(3.5);
  });

  it("weight rounds floats to integer grams (no float drift)", () => {
    const w = HEALTH_METRIC_CONFIG.weight;
    // 3.5001 kg → 3500.1 → round → 3500
    expect(w.toStorage(3.5001)).toBe(3500);
  });

  it("temperature: 38.5°C ↔ 3850 cd (integer storage)", () => {
    const t = HEALTH_METRIC_CONFIG.temperature;
    expect(t.toStorage(38.5)).toBe(3850);
    expect(t.toDisplay(3850)).toBe(38.5);
  });

  it("temperature handles decimal precision typical of vet thermometers", () => {
    const t = HEALTH_METRIC_CONFIG.temperature;
    expect(t.toStorage(38.42)).toBe(3842);
    expect(t.toDisplay(3842)).toBe(38.42);
  });

  it("heart rate stays an integer", () => {
    const h = HEALTH_METRIC_CONFIG.heart_rate;
    expect(h.toStorage(72.7)).toBe(73);
    expect(h.toDisplay(72)).toBe(72);
  });

  it("emotional 1–5 scales round-trip identically", () => {
    for (const id of EMOTIONAL_METRICS) {
      const def = HEALTH_METRIC_CONFIG[id];
      for (const v of [1, 2, 3, 4, 5]) {
        expect(def.toDisplay(def.toStorage(v))).toBe(v);
      }
    }
  });
});

describe("PHYSICAL_METRICS / EMOTIONAL_METRICS partition the metric set", () => {
  it("every MetricId belongs to exactly one bucket", () => {
    const all = [...PHYSICAL_METRICS, ...EMOTIONAL_METRICS];
    expect(new Set(all).size).toBe(all.length); // no overlap
    expect(all.length).toBe(Object.keys(HEALTH_METRIC_CONFIG).length);
  });

  it("each metric's category field matches its bucket", () => {
    for (const id of PHYSICAL_METRICS) {
      expect(HEALTH_METRIC_CONFIG[id].category, `${id}`).toBe("physical");
    }
    for (const id of EMOTIONAL_METRICS) {
      expect(HEALTH_METRIC_CONFIG[id].category, `${id}`).toBe("emotional");
    }
  });
});

describe("anxiety is the only inverted metric", () => {
  it("inverted=true on anxiety, falsy on every other metric", () => {
    expect(HEALTH_METRIC_CONFIG.anxiety.inverted).toBe(true);
    for (const id of Object.keys(HEALTH_METRIC_CONFIG) as (keyof typeof HEALTH_METRIC_CONFIG)[]) {
      if (id === "anxiety") continue;
      expect(HEALTH_METRIC_CONFIG[id].inverted, `${id}`).toBeFalsy();
    }
  });
});
