import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import {
  adoptionApplications,
  adoptionApplicationStatusEnum,
  adoptionListings,
  users,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/guards";

const patchSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(adoptionApplicationStatusEnum.enumValues),
});

type Params = { params: Promise<{ listingId: string }> };

/**
 * GET /api/adoptions/[listingId]/applications
 * — listing owner sees all applications for their listing
 * — applicant sees only their own application
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { listingId } = await params;
  const db = getInstance();

  const [listing] = await db
    .select({ ownerId: adoptionListings.ownerId })
    .from(adoptionListings)
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const isOwner = listing.ownerId === session.user.id;
  const isAdmin = session.user.role === "admin";

  const conditions = [eq(adoptionApplications.listingId, listingId)];
  if (!isOwner && !isAdmin) {
    // Regular applicant: only their own
    conditions.push(eq(adoptionApplications.applicantId, session.user.id));
  }

  const rows = await db
    .select({
      id: adoptionApplications.id,
      listingId: adoptionApplications.listingId,
      status: adoptionApplications.status,
      message: adoptionApplications.message,
      experience: adoptionApplications.experience,
      housingType: adoptionApplications.housingType,
      createdAt: adoptionApplications.createdAt,
      applicant: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(adoptionApplications)
    .innerJoin(users, eq(users.id, adoptionApplications.applicantId))
    .where(and(...conditions))
    .orderBy(desc(adoptionApplications.createdAt));

  return NextResponse.json({ success: true, data: rows });
}

/**
 * PATCH /api/adoptions/[listingId]/applications
 * — listing owner approves / rejects an application
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { listingId } = await params;
  const db = getInstance();

  const [listing] = await db
    .select({ ownerId: adoptionListings.ownerId })
    .from(adoptionListings)
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin && listing.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(adoptionApplications)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(
      and(
        eq(adoptionApplications.id, parsed.data.applicationId),
        eq(adoptionApplications.listingId, listingId),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
