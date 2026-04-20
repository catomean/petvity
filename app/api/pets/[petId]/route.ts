import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  breed: z.string().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sex: z.enum(["male", "female", "unknown"]).optional(),
  weightGrams: z.number().int().positive().optional(),
  bio: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  handle: z.string().max(50).regex(/^[a-z0-9-]+$/).optional(),
});

type Params = { params: Promise<{ petId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const db = getInstance();
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });

  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: pet });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const body = await req.json();
  const parsed = updatePetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [updated] = await db
    .update(pets)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const db = getInstance();
  const [deleted] = await db
    .delete(pets)
    .where(and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)))
    .returning({ id: pets.id });

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
