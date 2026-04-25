import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatDateShort,
  formatWeight,
  formatTemperature,
  formatRelativeDate,
  formatPetAgeShort,
  formatPetAge,
} from "./format";

describe("formatDateShort", () => {
  it("formats a date string with locale-appropriate month name (en)", () => {
    const result = formatDateShort("2026-01-15", "en");
    expect(result).toContain("15");
    expect(result).toContain("2026");
    expect(result).toMatch(/Jan/);
  });

  it("handles December correctly with explicit locale (en)", () => {
    const result = formatDateShort("2025-12-31", "en");
    expect(result).toContain("31");
    expect(result).toContain("2025");
    expect(result).toMatch(/Dec/);
  });

  it("respects locale parameter (ja → Japanese month notation)", () => {
    const result = formatDateShort("2026-01-15", "ja");
    expect(result).toContain("15");
    expect(result).toContain("2026");
    // Japanese formats month with 月 character
    expect(result).toMatch(/月/);
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

/**
 * Both formatPetAgeShort and formatPetAge use Date.now() internally.
 * Pin system time to a fixed date so the tests are deterministic.
 * now = 2026-04-24T12:00:00Z
 */
describe("formatPetAgeShort", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-04-24T12:00:00Z")); });
  afterEach(() => vi.useRealTimers());

  it("returns empty string for null", () => {
    expect(formatPetAgeShort(null)).toBe("");
  });

  it("returns '< 1mo' for a pet born less than 1 month ago", () => {
    expect(formatPetAgeShort("2026-04-21")).toBe("< 1mo"); // 3 days ago
  });

  it("returns months for 1–11 month old pets", () => {
    expect(formatPetAgeShort("2026-01-24")).toBe("2mo");  // ~90 days = 2 months
    expect(formatPetAgeShort("2025-07-24")).toBe("9mo");  // ~9 months
  });

  it("returns years for pets 12+ months old", () => {
    expect(formatPetAgeShort("2025-04-24")).toBe("1yr"); // exactly 12 months
    expect(formatPetAgeShort("2024-04-24")).toBe("2yr"); // exactly 24 months
  });
});

describe("formatPetAge", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-04-24T12:00:00Z")); });
  afterEach(() => vi.useRealTimers());

  it("returns empty string for null", () => {
    expect(formatPetAge(null)).toBe("");
  });

  it("returns '< 1 month old' for a very young pet", () => {
    expect(formatPetAge("2026-04-21")).toBe("< 1 month old");
  });

  it("returns 'N months old' for 1–11 month old pets", () => {
    expect(formatPetAge("2026-01-24")).toBe("2 months old");
  });

  it("returns 'N year(s) old' for exactly whole years", () => {
    expect(formatPetAge("2025-04-24")).toBe("1 year old");
    expect(formatPetAge("2024-04-24")).toBe("2 years old");
  });

  it("returns 'Ny Nmo old' when years + remaining months", () => {
    // 2023-10-24 → ~30 months → 2 years 6 months
    expect(formatPetAge("2023-10-24")).toBe("2y 6mo old");
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

  it("returns plural 'N days ago' for large past offsets", () => {
    expect(formatRelativeDate("2025-12-16", now)).toBe("30 days ago");
  });

  it("returns plural 'In N days' for large future offsets", () => {
    expect(formatRelativeDate("2026-02-14", now)).toBe("In 30 days");
  });
});
