import { NextRequest, NextResponse } from "next/server";
import { eq, and, avg, count, inArray, ilike, isNotNull, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { sitterProfiles, users, reviews } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const city = req.nextUrl.searchParams.get("city");
  const accepting = req.nextUrl.searchParams.get("accepting");

  const db = getInstance();

  const conditions = [
    eq(users.role, "pet_sitter"),
    isNotNull(sitterProfiles.services),
    isNotNull(sitterProfiles.pricePerDay),
    isNotNull(sitterProfiles.city),
    isNotNull(sitterProfiles.phone),
    sql`length(coalesce(${sitterProfiles.bio}, '')) >= 40`,
  ];
  if (accepting === "true") conditions.push(eq(sitterProfiles.isAcceptingClients, true));
  if (city) conditions.push(ilike(sitterProfiles.city, `%${city}%`));

  const PAGE = 50;
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
    .where(and(...conditions))
    .limit(PAGE + 1);

  const hasMore = rows.length > PAGE;
  const filtered = rows.slice(0, PAGE);

  if (filtered.length === 0) {
    return NextResponse.json({ success: true, data: [], meta: { hasMore: false } });
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

  return NextResponse.json({ success: true, data, meta: { hasMore } });
}
