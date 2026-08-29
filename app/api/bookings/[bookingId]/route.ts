import { NextRequest, NextResponse } from "next/server";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { bookings, bookingStatusEnum, pets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { bookingStatusChanged } from "@/lib/email/templates";

const updateSchema = z.object({
  status: z.enum(bookingStatusEnum.enumValues),
});

type Params = { params: Promise<{ bookingId: string }> };

/** PATCH /api/bookings/[bookingId] — update booking status */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { bookingId } = await params;
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();

  // Only owner (can cancel) or professional (can confirm/cancel/complete) can update
  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        or(eq(bookings.ownerId, userId), eq(bookings.professionalId, userId)),
      ),
    )
    .limit(1);

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
  }

  const { status } = parsed.data;
  const isProfessional = booking.professionalId === userId;
  const isOwner = booking.ownerId === userId;

  // Owners can only cancel
  if (isOwner && !isProfessional && status !== "cancelled") {
    return NextResponse.json(
      { success: false, error: "Owners can only cancel bookings." },
      { status: 403 },
    );
  }

  const [updated] = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Notify the owner when the professional changes status — fire-and-forget
  const shouldNotifyOwner =
    isProfessional && (status === "confirmed" || status === "cancelled" || status === "completed");

  if (shouldNotifyOwner) {
    Promise.all([
      db
        .select({ email: users.email, name: users.name, locale: users.locale })
        .from(users)
        .where(eq(users.id, booking.ownerId))
        .limit(1),
      db.select({ name: pets.name }).from(pets).where(eq(pets.id, booking.petId)).limit(1),
    ])
      .then(([[owner], [petRow]]) => {
        if (!owner) return;
        const formatDate = (d: Date) =>
          d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        sendEmail({
          to: owner.email,
          ...bookingStatusChanged(
            {
              ownerName: owner.name ?? "there",
              petName: petRow?.name ?? "your pet",
              status: status as "confirmed" | "cancelled" | "completed",
              startDate: formatDate(booking.startDate),
            },
            owner.locale,
          ),
        }).catch(() => {
          /* email failure must not affect response */
        });
      })
      .catch(() => {
        /* lookup failure must not affect response */
      });
  }

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE /api/bookings/[bookingId] — owner can delete a pending booking */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { bookingId } = await params;
  const userId = session.user.id;

  const db = getInstance();

  const [booking] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.ownerId, userId)))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
  }

  if (booking.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "Only pending bookings can be deleted." },
      { status: 400 },
    );
  }

  await db.delete(bookings).where(eq(bookings.id, bookingId));
  return NextResponse.json({ success: true });
}
