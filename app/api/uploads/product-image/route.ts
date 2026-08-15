import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { putLocal } from "@/lib/storage";
import { requireSession } from "@/lib/auth/guards";
import {
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_MB,
} from "@/lib/config/uploads";

/**
 * Upload a product photo and return its URL.
 *
 * Deliberately not scoped to a product id: the seller picks the photo while
 * filling in the "new product" form, before a row exists. Scoping it would
 * force create-then-upload, which leaves a product visibly imageless if the
 * second call fails. The caller submits the returned URL as `imageUrl`.
 *
 * Any signed-in user may upload — sellers list their own products, and the
 * only thing an upload yields is a URL that is worthless until it is attached
 * to a product the caller is allowed to write.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 },
    );
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: `Image is too large (max ${IMAGE_MAX_MB} MB).` },
      { status: 413 },
    );
  }

  if (file.type && !(IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "Only JPEG, PNG, WebP, or GIF images are accepted." },
      { status: 415 },
    );
  }

  let blob;
  try {
    // Keyed by uploader so an abandoned upload is traceable to an account.
    blob = await putLocal(`products/${session.user.id}/${randomUUID()}`, file);
  } catch (err) {
    console.error("[product-image] upload failed", err);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, data: { url: blob.url } });
}
