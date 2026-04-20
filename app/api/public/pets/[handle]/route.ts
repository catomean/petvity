import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";

type Params = { params: Promise<{ handle: string }> };

/** Public pet profile — no authentication required. Only returns isPublic=true pets. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { handle } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.handle, handle), eq(pets.isPublic, true)),
  });

  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Only expose safe public fields
  const publicPet = {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    birthDate: pet.birthDate,
    sex: pet.sex,
    bio: pet.bio,
    avatarUrl: pet.avatarUrl,
    handle: pet.handle,
  };

  return NextResponse.json({ success: true, data: publicPet });
}
