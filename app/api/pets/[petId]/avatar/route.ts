import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { putLocal } from "@/lib/storage";
import { and, eq } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

/** Cap at 5 MB — pet avatars don't need more, and rejecting a huge upload
 *  early is faster + cheaper than streaming it to disk. */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: `Image is too large (max ${MAX_BYTES / 1024 / 1024} MB).` },
      { status: 413 },
    );
  }

  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "Only JPEG, PNG, WebP, or GIF images are accepted." },
      { status: 415 },
    );
  }

  let blob;
  try {
    // Random suffix keeps old avatar URLs valid until the row is updated.
    blob = await putLocal(`pets/${petId}/avatar-${randomUUID()}`, file);
  } catch (err) {
    console.error("[avatar] upload failed", err);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again in a moment." },
      { status: 502 },
    );
  }

  await db
    .update(pets)
    .set({ avatarUrl: blob.url, updatedAt: new Date() })
    .where(eq(pets.id, petId));

  return NextResponse.json({ success: true, data: { url: blob.url } });
}
