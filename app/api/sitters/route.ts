import { NextRequest, NextResponse } from "next/server";
import { eq, and, avg, count, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { sitterProfiles, users, reviews } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const city = req.nextUrl.searchParams.get("city");
  const accepting = req.nextUrl.searchParams.get("accepting");

  const db = getInstance();

  const conditions = [eq(users.role, "pet_sitter")];
  if (accepting === "true") {
    conditions.push(eq(sitterProfiles.isAcceptingClients, true));
  }

  const rows = await db
    .select({
      id: sitterProfiles.id,
      userId: sitterProfiles.userId,
      name: users.name,
      bio: sitterProfiles.bio,
      services: sitterProfiles.services,
      pricePerDay: sitterProfiles.pricePerDay,
      city: sitterProfiles.city,
      country: sitterProfiles.country,
      phone: sitterProfiles.phone,
      isAcceptingClients: sitterProfiles.isAcceptingClients,
      isVerified: sitterProfiles.isVerified,
    })
    .from(sitterProfiles)
    .innerJoin(users, eq(users.id, sitterProfiles.userId))
    .where(and(...conditions));

  const filtered = city
    ? rows.filter((r) => r.city?.toLowerCase().includes(city.toLowerCase()))
    : rows;

  if (filtered.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Fetch review aggregates for all returned professionals in one query
  const professionalIds = filtered.map((r) => r.userId);
  const ratingRows = await db
    .select({
      professionalId: reviews.professionalId,
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(inArray(reviews.professionalId, professionalIds))
    .groupBy(reviews.professionalId);

  const ratingMap = new Map(
    ratingRows.map((r) => [
      r.professionalId,
      { avgRating: r.avgRating ? Number(Number(r.avgRating).toFixed(1)) : null, reviewCount: r.reviewCount },
    ])
  );

  const data = filtered.map((r) => ({
    ...r,
    avgRating: ratingMap.get(r.userId)?.avgRating ?? null,
    reviewCount: ratingMap.get(r.userId)?.reviewCount ?? 0,
  }));

  return NextResponse.json({ success: true, data });
}
