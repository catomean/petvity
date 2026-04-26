import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import {
  users,
  pets,
  healthMetrics,
  healthRecords,
  vaccinations,
  medications,
  bookings,
  reviews,
  orders,
  orderItems,
  products,
  adoptionListings,
  adoptionApplications,
  petSignalHistory,
} from "@/lib/db/schema";

/** GET /api/account/export — bundle every user-owned row into a downloadable
 *  JSON file. GDPR Article 15 (right of access). Auth-only, current user only.
 *
 *  Includes data the user owns OR submitted:
 *    - account profile (sanitized — no password hash)
 *    - pets and everything that hangs off them
 *    - bookings + reviews they wrote
 *    - orders they placed (with items)
 *    - products they listed (sellerId match)
 *    - adoption listings + applications they submitted
 */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const userId = session.user.id;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      locale: users.locale,
      digestOptOut: users.digestOptOut,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
  }

  // Pets owned + their dependent records
  const userPets = await db.select().from(pets).where(eq(pets.ownerId, userId));
  const petIds = userPets.map((p) => p.id);

  const [
    metrics,
    records,
    vacs,
    meds,
    signalHistory,
    userBookings,
    userReviews,
    userOrders,
    userListedProducts,
    userListings,
    userApplications,
  ] = await Promise.all([
    petIds.length ? db.select().from(healthMetrics).where(inArray(healthMetrics.petId, petIds)) : [],
    petIds.length ? db.select().from(healthRecords).where(inArray(healthRecords.petId, petIds)) : [],
    petIds.length ? db.select().from(vaccinations).where(inArray(vaccinations.petId, petIds)) : [],
    petIds.length ? db.select().from(medications).where(inArray(medications.petId, petIds)) : [],
    petIds.length ? db.select().from(petSignalHistory).where(inArray(petSignalHistory.petId, petIds)) : [],
    db.select().from(bookings).where(eq(bookings.ownerId, userId)),
    db.select().from(reviews).where(eq(reviews.reviewerId, userId)),
    db.select().from(orders).where(eq(orders.userId, userId)),
    db.select().from(products).where(eq(products.sellerId, userId)),
    db.select().from(adoptionListings).where(eq(adoptionListings.ownerId, userId)),
    db.select().from(adoptionApplications).where(eq(adoptionApplications.applicantId, userId)),
  ]);

  // Order items live one indirection away — fetch by orderId
  const orderIds = userOrders.map((o) => o.id);
  const items = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    account: user,
    pets: userPets,
    healthMetrics: metrics,
    healthRecords: records,
    vaccinations: vacs,
    medications: meds,
    signalHistory,
    bookings: userBookings,
    reviewsWritten: userReviews,
    orders: userOrders,
    orderItems: items,
    productsListed: userListedProducts,
    adoptionListings: userListings,
    adoptionApplicationsSubmitted: userApplications,
  };

  const filename = `petvity-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
