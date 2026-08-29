import { describe, it, expect } from "vitest";
import { computeWellnessScore, getMetricDisplay } from "./health";

describe("computeWellnessScore", () => {
  it("returns null when no metrics provided", () => {
    expect(computeWellnessScore({}, "dog")).toBeNull();
  });

  it("returns null when all values are null/undefined", () => {
    // @ts-expect-error testing runtime null values
    expect(computeWellnessScore({ weight: null, energy: undefined }, "dog")).toBeNull();
  });

  it("returns 0–100 for a single metric", () => {
    // temperature at midpoint of dog normal range (3800–3900) → midpoint 3850 → score = 100
    const score = computeWellnessScore({ temperature: 3850 }, "dog");
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(100);
    expect(score!).toBeGreaterThan(80); // at midpoint → high score
  });

  it("gives a high score when all metrics are in the normal range", () => {
    const score = computeWellnessScore(
      {
        weight: 5000, // 5 kg — well within default 50–200000 g
        temperature: 3850, // 38.5°C — midpoint of dog range 3800–3900
        heart_rate: 80, // in 40–400 bpm
        energy: 4, // in 3–5 range
        mood: 4, // in 3–5 range
        anxiety: 1, // in 1–2 (inverted: 1 = calm)
        socialization: 4, // in 3–5 range
      },
      "dog",
    );
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(70);
  });

  it("inverted metric: low anxiety (calm) scores higher than high anxiety (stressed)", () => {
    const calmScore = computeWellnessScore({ anxiety: 1 }, "dog"); // calm
    const stressedScore = computeWellnessScore({ anxiety: 5 }, "dog"); // stressed
    expect(calmScore).not.toBeNull();
    expect(stressedScore).not.toBeNull();
    expect(calmScore!).toBeGreaterThan(stressedScore!);
  });

  it("averages across all provided metrics", () => {
    // Two metrics: one perfect, one terrible — score should be between extremes
    const score = computeWellnessScore(
      { energy: 5, mood: 1 }, // energy at top of range, mood at bottom
      "dog",
    );
    expect(score).not.toBeNull();
    const fullScore = computeWellnessScore({ energy: 5 }, "dog");
    const lowScore = computeWellnessScore({ mood: 1 }, "dog");
    expect(score!).toBeLessThan(fullScore!);
    expect(score!).toBeGreaterThan(lowScore!);
  });

  it("scores 100 when physical metric is exactly at normal range boundary", () => {
    // dog temperature range 3800–3900; value at max boundary (3900) must score 100, not ~67
    const score = computeWellnessScore({ temperature: 3900 }, "dog");
    expect(score).toBe(100);
  });

  it("scores 100 when emotional metric is exactly at normal range boundary", () => {
    // dog energy range 3–5; value at min boundary (3) must score 100, not 50
    const score = computeWellnessScore({ energy: 3 }, "dog");
    expect(score).toBe(100);
  });

  it("uses species-specific normal ranges when available", () => {
    // Species-specific ranges may differ; score for same value varies by species
    const dogScore = computeWellnessScore({ temperature: 3850 }, "dog");
    const horseScore = computeWellnessScore({ temperature: 3850 }, "horse");
    // Both should be valid numbers — not testing equality, just that it runs
    expect(dogScore).not.toBeNull();
    expect(horseScore).not.toBeNull();
  });
});

describe("getMetricDisplay", () => {
  it("converts weight from grams to kg", () => {
    const d = getMetricDisplay("weight", 3500, "dog");
    expect(d.value).toBe(3.5);
    expect(d.unit).toBe("kg");
  });

  it("converts temperature from centidegrees to °C", () => {
    const d = getMetricDisplay("temperature", 3850, "dog");
    expect(d.value).toBe(38.5);
    expect(d.unit).toBe("°C");
  });

  it("marks value as inRange when within normal bounds", () => {
    // dog heart_rate default 40–400; 80 is in range
    const d = getMetricDisplay("heart_rate", 80, "dog");
    expect(d.inRange).toBe(true);
  });

  it("marks value as out of range when outside normal bounds", () => {
    // temperature 2000 centidegrees (20°C) is way below dog normal range
    const d = getMetricDisplay("temperature", 2000, "dog");
    expect(d.inRange).toBe(false);
  });

  it("returns label and unit for emotional metrics", () => {
    const d = getMetricDisplay("energy", 4, "dog");
    expect(d.label).toBeTruthy();
    expect(d.unit).toBe("/5");
    expect(d.value).toBe(4);
  });
});
