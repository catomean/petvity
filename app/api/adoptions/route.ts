import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { adoptionListings, adoptionApplications, pets, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  petId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  feeCents: z.number().int().min(0).nullable().optional(),
  location: z.string().max(150).nullable().optional(),
  requiresExperience: z.boolean().optional(),
  goodWithKids: z.boolean().nullable().optional(),
  goodWithDogs: z.boolean().nullable().optional(),
  goodWithCats: z.boolean().nullable().optional(),
});

const SELECT_LISTING = {
  id: adoptionListings.id,
  title: adoptionListings.title,
  description: adoptionListings.description,
  feeCents: adoptionListings.feeCents,
  location: adoptionListings.location,
  requiresExperience: adoptionListings.requiresExperience,
  goodWithKids: adoptionListings.goodWithKids,
  goodWithDogs: adoptionListings.goodWithDogs,
  goodWithCats: adoptionListings.goodWithCats,
  status: adoptionListings.status,
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
} as const;

/**
 * GET /api/adoptions
 * - ?mine=1     → authenticated user's own listings (all statuses)
 * - ?applied=1  → authenticated user's submitted applications (with listing + pet info)
 * - ?species=   → filter public listings by species
 * - default     → public browse (available listings only)
 */
export async function GET(req: NextRequest) {
  const db = getInstance();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";
  const applied = searchParams.get("applied") === "1";
  const species = searchParams.get("species");
  const location = searchParams.get("location");

  // Applicant's submitted applications — requires auth
  if (applied) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const ownerUser = alias(users, "owner_user");
    const rows = await db
      .select({
        applicationId: adoptionApplications.id,
        applicationStatus: adoptionApplications.status,
        message: adoptionApplications.message,
        createdAt: adoptionApplications.createdAt,
        listingId: adoptionListings.id,
        listingTitle: adoptionListings.title,
        listingStatus: adoptionListings.status,
        location: adoptionListings.location,
        feeCents: adoptionListings.feeCents,
        petId: pets.id,
        petName: pets.name,
        petSpecies: pets.species,
        petBreed: pets.breed,
        petAvatarUrl: pets.avatarUrl,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
      })
      .from(adoptionApplications)
      .innerJoin(adoptionListings, eq(adoptionListings.id, adoptionApplications.listingId))
      .innerJoin(pets, eq(pets.id, adoptionListings.petId))
      .innerJoin(ownerUser, eq(ownerUser.id, adoptionListings.ownerId))
      .where(eq(adoptionApplications.applicantId, session.user.id))
      .orderBy(desc(adoptionApplications.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  // Owner's own listings — requires auth
  if (mine) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const rows = await db
      .select(SELECT_LISTING)
      .from(adoptionListings)
      .innerJoin(pets, eq(pets.id, adoptionListings.petId))
      .where(eq(adoptionListings.ownerId, session.user.id))
      .orderBy(desc(adoptionListings.createdAt));
    return NextResponse.json({ success: true, data: rows });
  }

  // Public browse — available only
  const conditions = [eq(adoptionListings.status, "available")];
  if (species) {
    conditions.push(eq(pets.species, species as typeof pets.species._.data));
  }

  const rows = await db
    .select(SELECT_LISTING)
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .where(and(...conditions))
    .orderBy(desc(adoptionListings.createdAt))
    .limit(100);

  // Optional client-side location filter (case-insensitive substring)
  const filtered = location
    ? rows.filter((r) =>
        r.location?.toLowerCase().includes(location.toLowerCase()),
      )
    : rows;

  return NextResponse.json({ success: true, data: filtered });
}

/** POST /api/adoptions — create listing (owner of pet only) */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();

  // Verify pet belongs to this user
  const [pet] = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, parsed.data.petId), eq(pets.ownerId, session.user.id)))
    .limit(1);

  if (!pet) {
    return NextResponse.json(
      { success: false, error: "Pet not found" },
      { status: 404 },
    );
  }

  // Only one active listing per pet at a time
  const [existing] = await db
    .select({ id: adoptionListings.id })
    .from(adoptionListings)
    .where(
      and(
        eq(adoptionListings.petId, parsed.data.petId),
        ne(adoptionListings.status, "withdrawn"),
        ne(adoptionListings.status, "adopted"),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { success: false, error: "This pet already has an active adoption listing." },
      { status: 409 },
    );
  }

  const [listing] = await db
    .insert(adoptionListings)
    .values({
      petId: parsed.data.petId,
      ownerId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      feeCents: parsed.data.feeCents ?? null,
      location: parsed.data.location ?? null,
      requiresExperience: parsed.data.requiresExperience ?? false,
      goodWithKids: parsed.data.goodWithKids ?? null,
      goodWithDogs: parsed.data.goodWithDogs ?? null,
      goodWithCats: parsed.data.goodWithCats ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, data: listing }, { status: 201 });
}
