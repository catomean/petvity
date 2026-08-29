import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { bookings, professionalBlockedDates } from "@/lib/db/schema";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/domain/scheduling";

/**
 * GET /api/bookings/busy?professionalId=… — the professional's busy periods
 * for the next 6 months, so the booking form can steer owners toward free
 * dates instead of letting them guess and hit a 409.
 * Privacy-safe: date ranges only, no owners, pets, or reasons.
 */
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const professionalId = req.nextUrl.searchParams.get("professionalId");
  if (!professionalId) {
    return NextResponse.json({ success: false, error: "professionalId required" }, { status: 400 });
  }

  const db = getInstance();
  const now = new Date();

  const [activeBookings, blocked] = await Promise.all([
    db
      .select({ start: bookings.startDate, end: bookings.endDate })
      .from(bookings)
      .where(
        and(
          eq(bookings.professionalId, professionalId),
          inArray(bookings.status, [...BLOCKING_BOOKING_STATUSES]),
          gt(bookings.endDate, now),
        ),
      ),
    db
      .select({
        startDate: professionalBlockedDates.startDate,
        endDate: professionalBlockedDates.endDate,
      })
      .from(professionalBlockedDates)
      .where(eq(professionalBlockedDates.professionalId, professionalId)),
  ]);

  // Normalize everything to inclusive date-only ranges (what the form shows).
  const ranges = [
    ...activeBookings.map((b) => ({
      start: b.start.toISOString().slice(0, 10),
      end: b.end.toISOString().slice(0, 10),
    })),
    ...blocked.map((b) => ({ start: b.startDate, end: b.endDate })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return NextResponse.json({ success: true, data: ranges });
}
