import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { adoptionApplications, adoptionListings } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const applySchema = z.object({
  message: z.string().max(1000).nullable().optional(),
  experience: z.string().max(1000).nullable().optional(),
  housingType: z.string().max(100).nullable().optional(),
});

type Params = { params: Promise<{ listingId: string }> };

/** POST /api/adoptions/[listingId]/apply — submit adoption application */
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { listingId } = await params;
  const db = getInstance();

  // Listing must exist and be available
  const [listing] = await db
    .select({ id: adoptionListings.id, ownerId: adoptionListings.ownerId, status: adoptionListings.status })
    .from(adoptionListings)
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
  }
  if (listing.status !== "available") {
    return NextResponse.json(
      { success: false, error: "This listing is no longer accepting applications." },
      { status: 409 },
    );
  }
  if (listing.ownerId === session.user.id) {
    return NextResponse.json(
      { success: false, error: "You cannot apply to your own listing." },
      { status: 400 },
    );
  }

  // One application per user per listing
  const [existing] = await db
    .select({ id: adoptionApplications.id })
    .from(adoptionApplications)
    .where(
      and(
        eq(adoptionApplications.listingId, listingId),
        eq(adoptionApplications.applicantId, session.user.id),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { success: false, error: "You have already applied to this listing." },
      { status: 409 },
    );
  }

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [application] = await db
    .insert(adoptionApplications)
    .values({
      listingId,
      applicantId: session.user.id,
      message: parsed.data.message ?? null,
      experience: parsed.data.experience ?? null,
      housingType: parsed.data.housingType ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, data: application }, { status: 201 });
}
