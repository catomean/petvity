import { NextRequest, NextResponse } from "next/server";
import { eq, or, and, lt, gt, lte, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { bookings, pets, users, reviews, professionalBlockedDates } from "@/lib/db/schema";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/domain/scheduling";
import { sendEmail } from "@/lib/email";
import { bookingRequestReceived } from "@/lib/email/templates";

const createBookingSchema = z.object({
  petId: z.string().uuid(),
  professionalId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

/** GET /api/bookings — list bookings for the current user (as owner or professional) */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const userId = session.user.id;

  const rows = await db
    .select({
      id: bookings.id,
      petId: bookings.petId,
      petName: pets.name,
      ownerId: bookings.ownerId,
      ownerName: users.name,
      professionalId: bookings.professionalId,
      professionalRole: bookings.professionalRole,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      notes: bookings.notes,
      status: bookings.status,
      createdAt: bookings.createdAt,
      reviewId: reviews.id,
    })
    .from(bookings)
    .innerJoin(pets, eq(pets.id, bookings.petId))
    .innerJoin(users, eq(users.id, bookings.ownerId))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(
      or(
        eq(bookings.ownerId, userId),
        eq(bookings.professionalId, userId),
      )
    )
    .orderBy(bookings.startDate);

  return NextResponse.json({ success: true, data: rows });
}

/** POST /api/bookings — create a booking (pet owner only) */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { petId, professionalId, startDate, endDate, notes } = parsed.data;

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json(
      { success: false, error: "End date must be after start date." },
      { status: 400 },
    );
  }

  const db = getInstance();

  // Verify the pet belongs to the current user and fetch name for email
  const [pet] = await db
    .select({ id: pets.id, name: pets.name })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.ownerId, userId)))
    .limit(1);
  if (!pet) {
    return NextResponse.json(
      { success: false, error: "Pet not found." },
      { status: 404 },
    );
  }

  // Resolve the professional's role + contact info for notification
  const [professional] = await db
    .select({ role: users.role, email: users.email, name: users.name, locale: users.locale })
    .from(users)
    .where(eq(users.id, professionalId))
    .limit(1);
  if (!professional || (professional.role !== "veterinarian" && professional.role !== "pet_sitter")) {
    return NextResponse.json(
      { success: false, error: "Professional not found." },
      { status: 404 },
    );
  }

  // Conflict guard: the professional's time must be free. Half-open interval
  // overlap against active (pending/confirmed) bookings…
  const start = new Date(startDate);
  const end = new Date(endDate);
  const [clash] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.professionalId, professionalId),
        inArray(bookings.status, [...BLOCKING_BOOKING_STATUSES]),
        lt(bookings.startDate, end),
        gt(bookings.endDate, start),
      ),
    )
    .limit(1);
  if (clash) {
    return NextResponse.json(
      { success: false, error: "This professional is already booked during that time. Please pick different dates." },
      { status: 409 },
    );
  }

  // …and against their self-declared unavailable dates (inclusive day ranges).
  const [blocked] = await db
    .select({ id: professionalBlockedDates.id })
    .from(professionalBlockedDates)
    .where(
      and(
        eq(professionalBlockedDates.professionalId, professionalId),
        lte(professionalBlockedDates.startDate, endDate.slice(0, 10)),
        gte(professionalBlockedDates.endDate, startDate.slice(0, 10)),
      ),
    )
    .limit(1);
  if (blocked) {
    return NextResponse.json(
      { success: false, error: "This professional is unavailable during that period. Please pick different dates." },
      { status: 409 },
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      ownerId: userId,
      petId,
      professionalId,
      professionalRole: professional.role,
      startDate: start,
      endDate: end,
      notes: notes ?? null,
    })
    .returning();

  // Notify the professional — fire-and-forget, never fail the booking creation
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  sendEmail({
    to: professional.email,
    ...bookingRequestReceived({
      professionalName: professional.name ?? "there",
      ownerName: session.user.name ?? session.user.email ?? "A pet owner",
      petName: pet.name ?? "a pet",
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      notes,
    }, professional.locale),
  }).catch(() => {/* email failure must not break booking creation */});

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
