import { NextRequest, NextResponse } from "next/server";
import { eq, and, avg, count, inArray, ilike, isNotNull, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { groomerProfiles, users, reviews } from "@/lib/db/schema";

/** GET /api/groomers — browse groomers (portal), with review aggregates */
export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const city = req.nextUrl.searchParams.get("city");
  const accepting = req.nextUrl.searchParams.get("accepting");

  const db = getInstance();

  const conditions = [
    eq(users.role, "groomer"),
    isNotNull(groomerProfiles.salonName),
    isNotNull(groomerProfiles.services),
    isNotNull(groomerProfiles.priceFrom),
    isNotNull(groomerProfiles.city),
    isNotNull(groomerProfiles.phone),
    sql`length(coalesce(${groomerProfiles.bio}, '')) >= 40`,
  ];
  if (accepting === "true") conditions.push(eq(groomerProfiles.isAcceptingClients, true));
  if (city) conditions.push(ilike(groomerProfiles.city, `%${city}%`));

  const PAGE = 50;
  const rows = await db
    .select({
      id: groomerProfiles.id,
      userId: groomerProfiles.userId,
      name: users.name,
      salonName: groomerProfiles.salonName,
      bio: groomerProfiles.bio,
      services: groomerProfiles.services,
      priceFrom: groomerProfiles.priceFrom,
      city: groomerProfiles.city,
      country: groomerProfiles.country,
      phone: groomerProfiles.phone,
      isAcceptingClients: groomerProfiles.isAcceptingClients,
      isVerified: groomerProfiles.isVerified,
    })
    .from(groomerProfiles)
    .innerJoin(users, eq(users.id, groomerProfiles.userId))
    .where(and(...conditions))
    .limit(PAGE + 1);

  const hasMore = rows.length > PAGE;
  const filtered = rows.slice(0, PAGE);

  if (filtered.length === 0) {
    return NextResponse.json({ success: true, data: [], meta: { hasMore: false } });
  }

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
