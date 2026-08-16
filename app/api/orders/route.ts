import { NextRequest, NextResponse } from "next/server";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { paymentsEnabled } from "@/lib/payments/stripe";
import { orderCreateSchema, placeOrder } from "@/lib/domain/orders";

/** GET /api/orders — list current user's orders with items */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) {
    return NextResponse.json({ success: true, data: [], meta: { paymentsEnabled: paymentsEnabled() } });
  }

  const orderIds = userOrders.map((o) => o.id);
  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      productName: orderItems.productName,
      productImageUrl: products.imageUrl,
      productCategory: sql<string>`COALESCE(${products.category}::text, 'other')`,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(inArray(orderItems.orderId, orderIds));

  // Group items by orderId
  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  const data = userOrders.map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) ?? [],
  }));

  return NextResponse.json({ success: true, data, meta: { paymentsEnabled: paymentsEnabled() } });
}

/**
 * POST /api/orders — place an order as the signed-in user.
 *
 * The work lives in lib/domain/orders.ts because the public guest checkout
 * (/api/shop/checkout) places the same order with a different buyer identity.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await placeOrder({
    ...parsed.data,
    buyer: { kind: "account", userId: session.user.id },
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    { success: true, data: { ...result.order, items: result.items, checkoutUrl: result.checkoutUrl } },
    { status: 201 },
  );
}
