import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { groomerProfiles } from "@/lib/db/schema";

const profileSchema = z.object({
  salonName: z.string().max(200).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  services: z.string().max(200).nullable().optional(),
  priceFrom: z.number().int().min(0).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  isAcceptingClients: z.boolean().optional(),
});

export async function GET() {
  const { session, error } = await requireRole("groomer");
  if (error) return error;

  const db = getInstance();
  const profile = await db.query.groomerProfiles.findFirst({
    where: eq(groomerProfiles.userId, session.user.id),
  });

  return NextResponse.json({ success: true, data: profile ?? null });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("groomer");
  if (error) return error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();

  const existing = await db.query.groomerProfiles.findFirst({
    where: eq(groomerProfiles.userId, session.user.id),
  });

  if (existing) {
    const [updated] = await db
      .update(groomerProfiles)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(groomerProfiles.userId, session.user.id))
      .returning();
    return NextResponse.json({ success: true, data: updated });
  }

  const [created] = await db
    .insert(groomerProfiles)
    .values({ userId: session.user.id, ...parsed.data })
    .returning();

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole("groomer");
  if (error) return error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [updated] = await db
    .update(groomerProfiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(groomerProfiles.userId, session.user.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
