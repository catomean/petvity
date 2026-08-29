import { NextRequest, NextResponse } from "next/server";
import { eq, and, avg, count } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { reviews, bookings, users } from "@/lib/db/schema";

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/** GET /api/reviews?professionalId=xxx — list reviews for a professional with aggregates */
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const professionalId = req.nextUrl.searchParams.get("professionalId");
  if (!professionalId) {
    return NextResponse.json(
      { success: false, error: "professionalId is required." },
      { status: 400 },
    );
  }

  const db = getInstance();

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.reviewerId))
    .where(eq(reviews.professionalId, professionalId))
    .orderBy(reviews.createdAt);

  const [agg] = await db
    .select({
      avgRating: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.professionalId, professionalId));

  return NextResponse.json({
    success: true,
    data: rows,
    meta: {
      avgRating: agg?.avgRating ? Number(Number(agg.avgRating).toFixed(1)) : null,
      total: agg?.total ?? 0,
    },
  });
}

/** POST /api/reviews — owner submits review for a completed booking */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bookingId, rating, comment } = parsed.data;
  const db = getInstance();

  // Verify booking: must be owned by this user and have status=completed
  const [booking] = await db
    .select({
      ownerId: bookings.ownerId,
      professionalId: bookings.professionalId,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.ownerId, userId)))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
  }
  if (booking.status !== "completed") {
    return NextResponse.json(
      { success: false, error: "Reviews can only be left for completed bookings." },
      { status: 400 },
    );
  }

  // Check no existing review for this booking (unique constraint in DB, but fail gracefully)
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { success: false, error: "You have already reviewed this booking." },
      { status: 409 },
    );
  }

  const [review] = await db
    .insert(reviews)
    .values({
      bookingId,
      reviewerId: userId,
      professionalId: booking.professionalId,
      rating,
      comment: comment ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, data: review }, { status: 201 });
}
