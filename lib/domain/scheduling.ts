/**
 * Pure scheduling logic for professional bookings.
 * Timestamps are half-open intervals [start, end); blocked dates are
 * inclusive date-only ranges (whole days off).
 */

/** Booking statuses that occupy the professional's time. */
export const BLOCKING_BOOKING_STATUSES = ["pending", "confirmed"] as const;

/** Half-open interval overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅ */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Does the requested [start, end) touch an inclusive date-only blocked range?
 * A range blocked 2026-08-20..2026-08-21 occupies those two whole days in UTC.
 */
export function overlapsBlockedRange(
  start: Date,
  end: Date,
  blockedStartDate: string,
  blockedEndDate: string,
): boolean {
  const blockStart = new Date(`${blockedStartDate}T00:00:00.000Z`);
  const blockEnd = new Date(`${blockedEndDate}T00:00:00.000Z`);
  blockEnd.setUTCDate(blockEnd.getUTCDate() + 1); // inclusive → exclusive upper bound
  return intervalsOverlap(start, end, blockStart, blockEnd);
}
