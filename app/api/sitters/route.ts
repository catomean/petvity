import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { sitterProfiles, users } from "@/lib/db/schema";

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
      isAcceptingClients: sitterProfiles.isAcceptingClients,
      isVerified: sitterProfiles.isVerified,
    })
    .from(sitterProfiles)
    .innerJoin(users, eq(users.id, sitterProfiles.userId))
    .where(and(...conditions));

  const filtered = city
    ? rows.filter((r) => r.city?.toLowerCase().includes(city.toLowerCase()))
    : rows;

  return NextResponse.json({ success: true, data: filtered });
}
