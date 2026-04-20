import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { createPetHandle } from "@/lib/domain/pets";

const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum([
    "dog", "cat", "horse", "bird", "rabbit",
    "guinea_pig", "hamster", "reptile", "fish", "other",
  ]),
  breed: z.string().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  weightGrams: z.number().int().positive().optional(),
  bio: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const userPets = await db.query.pets.findMany({
    where: eq(pets.ownerId, session.user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json({ success: true, data: userPets });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createPetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const db = getInstance();
    const handle = createPetHandle(parsed.data.name);

    const [pet] = await db
      .insert(pets)
      .values({ ...parsed.data, ownerId: session.user.id, handle })
      .returning();

    return NextResponse.json({ success: true, data: pet }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create pet" },
      { status: 500 },
    );
  }
}
