import { NextRequest, NextResponse } from "next/server";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { bookings, bookingStatusEnum, pets, users } from "@/lib/db/schema";

const createBookingSchema = z.object({
  petId: z.string().uuid(),
  professionalId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

/** GET /api/bookings — list bookings for the current user (as owner or professional) */
export async function GET(_req: NextRequest) {
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
    })
    .from(bookings)
    .innerJoin(pets, eq(pets.id, bookings.petId))
    .innerJoin(users, eq(users.id, bookings.ownerId))
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

  // Verify the pet belongs to the current user
  const [pet] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.ownerId, userId)))
    .limit(1);
  if (!pet) {
    return NextResponse.json(
      { success: false, error: "Pet not found." },
      { status: 404 },
    );
  }

  // Resolve the professional's role
  const [professional] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, professionalId))
    .limit(1);
  if (!professional || (professional.role !== "veterinarian" && professional.role !== "pet_sitter")) {
    return NextResponse.json(
      { success: false, error: "Professional not found." },
      { status: 404 },
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      ownerId: userId,
      petId,
      professionalId,
      professionalRole: professional.role,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: notes ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
