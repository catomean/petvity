import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

type Params = { params: Promise<{ petId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { petId } = await params;
  const db = getInstance();

  // Verify ownership
  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 },
    );
  }

  const blob = await put(`pets/${petId}/avatar`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await db
    .update(pets)
    .set({ avatarUrl: blob.url, updatedAt: new Date() })
    .where(eq(pets.id, petId));

  return NextResponse.json({ success: true, data: { url: blob.url } });
}
