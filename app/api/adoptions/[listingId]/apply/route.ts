import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { adoptionApplications, adoptionListings, pets, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email";
import { adoptionApplicationReceived } from "@/lib/email/templates";

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
    .select({
      id: adoptionListings.id,
      ownerId: adoptionListings.ownerId,
      status: adoptionListings.status,
      petId: adoptionListings.petId,
    })
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

  // Notify listing owner (fire-and-forget)
  try {
    const [owner] = await db
      .select({ name: users.name, email: users.email, locale: users.locale })
      .from(users)
      .where(eq(users.id, listing.ownerId))
      .limit(1);

    const [pet] = await db
      .select({ name: pets.name })
      .from(pets)
      .where(eq(pets.id, listing.petId))
      .limit(1);

    if (owner?.email) {
      const tpl = adoptionApplicationReceived({
        ownerName: owner.name ?? owner.email,
        petName: pet?.name ?? "your pet",
        applicantName: session.user.name ?? session.user.email ?? "Someone",
        message: parsed.data.message ?? null,
        experience: parsed.data.experience ?? null,
        housingType: parsed.data.housingType ?? null,
      }, owner.locale);
      await sendEmail({ to: owner.email, ...tpl });
    }
  } catch {
    // Never fail the application response due to email error
  }

  return NextResponse.json({ success: true, data: application }, { status: 201 });
}
