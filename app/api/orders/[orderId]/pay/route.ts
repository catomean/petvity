import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { paymentsEnabled, createOrderCheckoutSession } from "@/lib/payments/stripe";

/** POST /api/orders/[orderId]/pay — (re)start Stripe Checkout for an unpaid order.
 *  Covers the buyer abandoning the first checkout: the order stays payable. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { session, error } = await requireSession();
  if (error) return error;

  if (!paymentsEnabled()) {
    return NextResponse.json({ success: false, error: "Payments are not enabled" }, { status: 503 });
  }

  const { orderId } = await params;
  const db = getInstance();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
  if (order.paidAt) {
    return NextResponse.json({ success: false, error: "Order is already paid" }, { status: 400 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ success: false, error: "Order was cancelled" }, { status: 400 });
  }

  const items = await db
    .select({
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      productName: orderItems.productName,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId));

  const checkout = await createOrderCheckoutSession({
    orderId,
    customerEmail: session.user.email ?? null,
    items: items.map((i) => ({
      name: i.productName,
      unitAmountCents: i.priceCents,
      quantity: i.quantity,
    })),
  });
  await db
    .update(orders)
    .set({ checkoutSessionId: checkout.sessionId, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return NextResponse.json({ success: true, data: { checkoutUrl: checkout.url } });
}
