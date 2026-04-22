import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { users, pets, vetProfiles, sitterProfiles } from "@/lib/db/schema";
import { eq, count, desc, inArray } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      petCount: count(pets.id),
    })
    .from(users)
    .leftJoin(pets, eq(pets.ownerId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  // Fetch isVerified for all professionals in one query each
  const professionalIds = rows
    .filter((r) => r.role === "veterinarian" || r.role === "pet_sitter")
    .map((r) => r.id);

  const verifiedMap = new Map<string, boolean>();

  if (professionalIds.length > 0) {
    const [vetRows, sitterRows] = await Promise.all([
      db
        .select({ userId: vetProfiles.userId, isVerified: vetProfiles.isVerified })
        .from(vetProfiles)
        .where(inArray(vetProfiles.userId, professionalIds)),
      db
        .select({ userId: sitterProfiles.userId, isVerified: sitterProfiles.isVerified })
        .from(sitterProfiles)
        .where(inArray(sitterProfiles.userId, professionalIds)),
    ]);
    for (const r of vetRows) verifiedMap.set(r.userId, r.isVerified);
    for (const r of sitterRows) verifiedMap.set(r.userId, r.isVerified);
  }

  const data = rows.map((r) => ({
    ...r,
    isVerified: verifiedMap.has(r.id) ? verifiedMap.get(r.id)! : null,
  }));

  return NextResponse.json({ success: true, data });
}
