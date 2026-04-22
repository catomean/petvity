import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { vetProfiles, users } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const city = req.nextUrl.searchParams.get("city");
  const accepting = req.nextUrl.searchParams.get("accepting");

  const db = getInstance();

  const conditions = [eq(users.role, "veterinarian")];
  if (accepting === "true") {
    conditions.push(eq(vetProfiles.isAcceptingClients, true));
  }

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
    .where(and(...conditions));

  const filtered = city
    ? rows.filter((r) => r.city?.toLowerCase().includes(city.toLowerCase()))
    : rows;

  return NextResponse.json({ success: true, data: filtered });
}
