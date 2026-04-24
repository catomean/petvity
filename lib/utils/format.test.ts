import { describe, it, expect } from "vitest";
import {
  formatDateShort,
  formatWeight,
  formatTemperature,
  formatRelativeDate,
} from "./format";

describe("formatDateShort", () => {
  it("formats a date string as Mon DD, YYYY", () => {
    const result = formatDateShort("2026-01-15");
    expect(result).toContain("15");
    expect(result).toContain("2026");
    expect(result).toMatch(/Jan/);
  });

  it("handles December correctly", () => {
    const result = formatDateShort("2025-12-31");
    expect(result).toContain("31");
    expect(result).toContain("2025");
    expect(result).toMatch(/Dec/);
  });
});

describe("formatWeight", () => {
  it("shows grams for values under 1 kg", () => {
    expect(formatWeight(500)).toBe("500 g");
    expect(formatWeight(999)).toBe("999 g");
  });

  it("shows kg for values 1000 g and above", () => {
    expect(formatWeight(1000)).toBe("1.0 kg");
    expect(formatWeight(3500)).toBe("3.5 kg");
    expect(formatWeight(25000)).toBe("25.0 kg");
  });

  it("rounds to one decimal place", () => {
    expect(formatWeight(1234)).toBe("1.2 kg");
  });
});

describe("formatTemperature", () => {
  it("converts centidegrees to degrees with one decimal", () => {
    expect(formatTemperature(3850)).toBe("38.5°C");
    expect(formatTemperature(4100)).toBe("41.0°C");
    expect(formatTemperature(3700)).toBe("37.0°C");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-01-15T12:00:00Z");

  it("returns 'Today' for the current date", () => {
    expect(formatRelativeDate("2026-01-15", now)).toBe("Today");
  });

  it("returns 'Tomorrow' for the next day", () => {
    expect(formatRelativeDate("2026-01-16", now)).toBe("Tomorrow");
  });

  it("returns 'Yesterday' for the previous day", () => {
    expect(formatRelativeDate("2026-01-14", now)).toBe("Yesterday");
  });

  it("returns 'In N days' for future dates", () => {
    expect(formatRelativeDate("2026-01-22", now)).toBe("In 7 days");
  });

  it("returns 'N days ago' for past dates", () => {
    expect(formatRelativeDate("2026-01-08", now)).toBe("7 days ago");
  });
});
