import { describe, it, expect } from "vitest";
import { intervalsOverlap, overlapsBlockedRange } from "./scheduling";

const d = (s: string) => new Date(s);

describe("intervalsOverlap", () => {
  it("detects a plain overlap", () => {
    expect(
      intervalsOverlap(
        d("2026-08-20T10:00Z"),
        d("2026-08-20T12:00Z"),
        d("2026-08-20T11:00Z"),
        d("2026-08-20T13:00Z"),
      ),
    ).toBe(true);
  });

  it("detects containment", () => {
    expect(
      intervalsOverlap(
        d("2026-08-20T10:00Z"),
        d("2026-08-24T10:00Z"),
        d("2026-08-21T00:00Z"),
        d("2026-08-22T00:00Z"),
      ),
    ).toBe(true);
  });

  it("treats back-to-back intervals as non-overlapping (half-open)", () => {
    expect(
      intervalsOverlap(
        d("2026-08-20T10:00Z"),
        d("2026-08-20T11:00Z"),
        d("2026-08-20T11:00Z"),
        d("2026-08-20T12:00Z"),
      ),
    ).toBe(false);
  });

  it("rejects disjoint intervals", () => {
    expect(
      intervalsOverlap(
        d("2026-08-20T10:00Z"),
        d("2026-08-20T11:00Z"),
        d("2026-08-21T10:00Z"),
        d("2026-08-21T11:00Z"),
      ),
    ).toBe(false);
  });
});

describe("overlapsBlockedRange", () => {
  it("blocks a booking inside a blocked day", () => {
    expect(
      overlapsBlockedRange(
        d("2026-08-20T09:00Z"),
        d("2026-08-20T10:00Z"),
        "2026-08-20",
        "2026-08-20",
      ),
    ).toBe(true);
  });

  it("blocks a multi-day booking that spans a blocked range", () => {
    expect(
      overlapsBlockedRange(
        d("2026-08-19T12:00Z"),
        d("2026-08-23T12:00Z"),
        "2026-08-20",
        "2026-08-21",
      ),
    ).toBe(true);
  });

  it("the blocked end date is inclusive — a booking on that day is blocked", () => {
    expect(
      overlapsBlockedRange(
        d("2026-08-21T09:00Z"),
        d("2026-08-21T10:00Z"),
        "2026-08-20",
        "2026-08-21",
      ),
    ).toBe(true);
  });

  it("the day after the blocked range is free", () => {
    expect(
      overlapsBlockedRange(
        d("2026-08-22T00:00Z"),
        d("2026-08-22T10:00Z"),
        "2026-08-20",
        "2026-08-21",
      ),
    ).toBe(false);
  });

  it("the day before the blocked range is free", () => {
    expect(
      overlapsBlockedRange(
        d("2026-08-19T00:00Z"),
        d("2026-08-20T00:00Z"),
        "2026-08-20",
        "2026-08-21",
      ),
    ).toBe(false);
  });
});
