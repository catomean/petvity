import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { adoptionListings, adoptionListingStatusEnum, pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  feeCents: z.number().int().min(0).nullable().optional(),
  location: z.string().max(150).nullable().optional(),
  status: z.enum(adoptionListingStatusEnum.enumValues).optional(),
  requiresExperience: z.boolean().optional(),
  goodWithKids: z.boolean().nullable().optional(),
  goodWithDogs: z.boolean().nullable().optional(),
  goodWithCats: z.boolean().nullable().optional(),
});

type Params = { params: Promise<{ listingId: string }> };

async function getListing(listingId: string) {
  const db = getInstance();
  const [row] = await db
    .select()
    .from(adoptionListings)
    .where(eq(adoptionListings.id, listingId))
    .limit(1);
  return row ?? null;
}

/** GET /api/adoptions/[listingId] — public, returns listing + pet data */
export async function GET(_req: NextRequest, { params }: Params) {
  const { listingId } = await params;
  const db = getInstance();

  const [row] = await db
    .select({
      id: adoptionListings.id,
      title: adoptionListings.title,
      description: adoptionListings.description,
      feeCents: adoptionListings.feeCents,
      location: adoptionListings.location,
      status: adoptionListings.status,
      requiresExperience: adoptionListings.requiresExperience,
      goodWithKids: adoptionListings.goodWithKids,
      goodWithDogs: adoptionListings.goodWithDogs,
      goodWithCats: adoptionListings.goodWithCats,
      createdAt: adoptionListings.createdAt,
      ownerId: adoptionListings.ownerId,
      pet: {
        id: pets.id,
        name: pets.name,
        species: pets.species,
        breed: pets.breed,
        birthDate: pets.birthDate,
        sex: pets.sex,
        avatarUrl: pets.avatarUrl,
        handle: pets.handle,
      },
    })
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: row });
}

/** PATCH /api/adoptions/[listingId] — owner can edit or change status */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { listingId } = await params;
  const listing = await getListing(listingId);

  if (!listing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin && listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [updated] = await db
    .update(adoptionListings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(adoptionListings.id, listingId))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE /api/adoptions/[listingId] — hard delete (owner or admin) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { listingId } = await params;
  const listing = await getListing(listingId);

  if (!listing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin && listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const db = getInstance();
  await db.delete(adoptionListings).where(eq(adoptionListings.id, listingId));

  return NextResponse.json({ success: true });
}
