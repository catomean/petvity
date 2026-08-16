import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { startCheckoutForOrder } from "@/lib/domain/orders";

/** POST /api/orders/[orderId]/pay — (re)start Stripe Checkout for an unpaid order.
 *  Covers the buyer abandoning the first checkout: the order stays payable.
 *  Account orders only — a guest pays from their receipt link instead, since a
 *  null userId can never match a session. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { orderId } = await params;
  const db = getInstance();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  const result = await startCheckoutForOrder(
    order,
    session.user.email ?? null,
    "/portal/orders",
  );
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, data: { checkoutUrl: result.checkoutUrl } });
}
