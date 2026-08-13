import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { professionalBlockedDates } from "@/lib/db/schema";

/**
 * A professional's own unavailable date ranges. Bookings that overlap any of
 * these are rejected by POST /api/bookings.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z
  .object({
    startDate: z.string().regex(DATE_RE),
    endDate: z.string().regex(DATE_RE),
    reason: z.string().max(200).nullish(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "endDate must not be before startDate",
    path: ["endDate"],
  });

function requireProfessional(role: string) {
  return role === "veterinarian" || role === "pet_sitter" || role === "groomer";
}

/** GET /api/availability — the current professional's blocked ranges */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireProfessional(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const db = getInstance();
  const rows = await db
    .select()
    .from(professionalBlockedDates)
    .where(eq(professionalBlockedDates.professionalId, session.user.id))
    .orderBy(asc(professionalBlockedDates.startDate));

  return NextResponse.json({ success: true, data: rows });
}

/** POST /api/availability — block a date range */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  if (!requireProfessional(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [created] = await db
    .insert(professionalBlockedDates)
    .values({
      professionalId: session.user.id,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason?.trim() || null,
    })
    .returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
