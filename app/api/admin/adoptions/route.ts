import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { adoptionListings, pets, users } from "@/lib/db/schema";

/** GET /api/admin/adoptions — all listings with pet + owner + application counts */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();

  const rows = await db
    .select({
      id: adoptionListings.id,
      status: adoptionListings.status,
      title: adoptionListings.title,
      location: adoptionListings.location,
      feeCents: adoptionListings.feeCents,
      createdAt: adoptionListings.createdAt,
      updatedAt: adoptionListings.updatedAt,
      pet: {
        id: pets.id,
        name: pets.name,
        species: pets.species,
        avatarUrl: pets.avatarUrl,
      },
      owner: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      applicationCount: sql<number>`(
        SELECT COUNT(*) FROM adoption_applications
        WHERE listing_id = ${adoptionListings.id}
      )`.mapWith(Number),
      pendingCount: sql<number>`(
        SELECT COUNT(*) FROM adoption_applications
        WHERE listing_id = ${adoptionListings.id} AND status = 'pending'
      )`.mapWith(Number),
    })
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .innerJoin(users, eq(users.id, adoptionListings.ownerId))
    .orderBy(desc(adoptionListings.createdAt))
    .limit(500);

  return NextResponse.json({ success: true, data: rows });
}
