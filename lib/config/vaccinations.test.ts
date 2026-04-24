import { describe, it, expect } from "vitest";
import { computeVaccinationDisplayStatus } from "./vaccinations";

const TODAY = "2026-04-24";
const YESTERDAY = "2026-04-23";
const IN_29_DAYS = "2026-05-23"; // within 30-day due-soon window
const IN_31_DAYS = "2026-05-25"; // outside 30-day window
const DUE_SOON_DAYS = 30;

describe("computeVaccinationDisplayStatus", () => {
  it("propagates not_applicable regardless of dates", () => {
    expect(
      computeVaccinationDisplayStatus("not_applicable", YESTERDAY, TODAY, DUE_SOON_DAYS),
    ).toBe("not_applicable");
    expect(
      computeVaccinationDisplayStatus("not_applicable", null, TODAY, DUE_SOON_DAYS),
    ).toBe("not_applicable");
    expect(
      computeVaccinationDisplayStatus("not_applicable", IN_31_DAYS, TODAY, DUE_SOON_DAYS),
    ).toBe("not_applicable");
  });

  it("returns up_to_date when nextDueDate is null (no booster needed)", () => {
    expect(
      computeVaccinationDisplayStatus("up_to_date", null, TODAY, DUE_SOON_DAYS),
    ).toBe("up_to_date");
    // Ignores stale stored status too
    expect(
      computeVaccinationDisplayStatus("overdue", null, TODAY, DUE_SOON_DAYS),
    ).toBe("up_to_date");
  });

  it("returns overdue when nextDueDate is in the past", () => {
    expect(
      computeVaccinationDisplayStatus("up_to_date", YESTERDAY, TODAY, DUE_SOON_DAYS),
    ).toBe("overdue");
  });

  it("overrides stale up_to_date stored status when date has passed", () => {
    // This is the core bug scenario: stored=up_to_date but date expired
    expect(
      computeVaccinationDisplayStatus("up_to_date", "2025-01-01", TODAY, DUE_SOON_DAYS),
    ).toBe("overdue");
  });

  it("returns due_soon when nextDueDate is within the window", () => {
    expect(
      computeVaccinationDisplayStatus("up_to_date", IN_29_DAYS, TODAY, DUE_SOON_DAYS),
    ).toBe("due_soon");
    // Exactly on the boundary
    expect(
      computeVaccinationDisplayStatus("up_to_date", TODAY, TODAY, DUE_SOON_DAYS),
    ).toBe("due_soon");
  });

  it("returns up_to_date when nextDueDate is beyond the due-soon window", () => {
    expect(
      computeVaccinationDisplayStatus("up_to_date", IN_31_DAYS, TODAY, DUE_SOON_DAYS),
    ).toBe("up_to_date");
  });

  it("honours a custom dueSoonDays window", () => {
    // With a 7-day window, IN_29_DAYS (29 days away) is still up_to_date
    expect(
      computeVaccinationDisplayStatus("up_to_date", IN_29_DAYS, TODAY, 7),
    ).toBe("up_to_date");
    // But IN_7_DAYS is due_soon
    const in7Days = "2026-05-01";
    expect(
      computeVaccinationDisplayStatus("up_to_date", in7Days, TODAY, 7),
    ).toBe("due_soon");
  });
});
