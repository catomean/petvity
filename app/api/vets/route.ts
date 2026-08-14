import { NextRequest, NextResponse } from "next/server";
import { eq, and, avg, count, inArray, ilike, isNotNull, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { vetProfiles, users, reviews } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const city = req.nextUrl.searchParams.get("city");
  const accepting = req.nextUrl.searchParams.get("accepting");

  const db = getInstance();

  // Only complete profiles are listed — same rule as the public directory
  // (lib/domain/profile-readiness): a customer must be able to act on it.
  const conditions = [
    eq(users.role, "veterinarian"),
    isNotNull(vetProfiles.clinicName),
    isNotNull(vetProfiles.specialty),
    isNotNull(vetProfiles.city),
    isNotNull(vetProfiles.phone),
    sql`length(coalesce(${vetProfiles.bio}, '')) >= 40`,
  ];
  if (accepting === "true") conditions.push(eq(vetProfiles.isAcceptingClients, true));
  if (city) conditions.push(ilike(vetProfiles.city, `%${city}%`));

  // Fetch 51 to cheaply detect whether there are more results beyond the limit
  const PAGE = 50;
  const rows = await db
    .select({
      id: vetProfiles.id,
      userId: vetProfiles.userId,
      name: users.name,
      specialty: vetProfiles.specialty,
      clinicName: vetProfiles.clinicName,
      city: vetProfiles.city,
      country: vetProfiles.country,
      bio: vetProfiles.bio,
      phone: vetProfiles.phone,
      isAcceptingClients: vetProfiles.isAcceptingClients,
      isVerified: vetProfiles.isVerified,
    })
    .from(vetProfiles)
    .innerJoin(users, eq(users.id, vetProfiles.userId))
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
