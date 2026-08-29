import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { sellerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";

const sellerSchema = z.object({
  displayName: z.string().max(200).nullable().optional(),
  bio: z.string().nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .nullable()
    .optional(),
  phone: z.string().max(50).nullable().optional(),
  website: z.string().url().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

/** GET /api/sellers/me — return own seller profile (null if not yet created) */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const profile = await db.query.sellerProfiles.findFirst({
    where: eq(sellerProfiles.userId, session.user.id),
  });

  return NextResponse.json({ success: true, data: profile ?? null });
}

/** POST /api/sellers/me — activate seller capability (create profile) */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const existing = await db.query.sellerProfiles.findFirst({
    where: eq(sellerProfiles.userId, session.user.id),
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Seller profile already exists" },
      { status: 409 },
    );
  }

  const parsed = sellerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const [profile] = await db
    .insert(sellerProfiles)
    .values({
      userId: session.user.id,
      displayName: body.displayName ?? session.user.name ?? null,
      bio: body.bio ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      isActive: true,
    })
    .returning();

  return NextResponse.json({ success: true, data: profile }, { status: 201 });
}

/** PATCH /api/sellers/me — update seller profile */
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const existing = await db.query.sellerProfiles.findFirst({
    where: eq(sellerProfiles.userId, session.user.id),
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "No seller profile found" }, { status: 404 });
  }

  const parsed = sellerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const [updated] = await db
    .update(sellerProfiles)
    .set({
      displayName: body.displayName !== undefined ? body.displayName : existing.displayName,
      bio: body.bio !== undefined ? body.bio : existing.bio,
      city: body.city !== undefined ? body.city : existing.city,
      country: body.country !== undefined ? body.country : existing.country,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      website: body.website !== undefined ? body.website : existing.website,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(sellerProfiles.userId, session.user.id))
    .returning();

  return NextResponse.json({ success: true, data: updated });
}
