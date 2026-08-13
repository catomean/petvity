import { NextResponse } from "next/server";
import { eq, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";

/** GET /api/orders/seller — orders containing items the current user listed.
 *  Returns each order with items filtered to ONLY the seller's products,
 *  plus buyer name/email for fulfillment context.
 */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const db = getInstance();

  // 1. Find all order_items for products this seller listed
  const sellerItems = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      productName: orderItems.productName,
      productImageUrl: products.imageUrl,
      productCategory: products.category,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(products.sellerId, session.user.id));

  if (sellerItems.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // 2. Fetch the parent orders + buyer info
  const orderIds = Array.from(new Set(sellerItems.map((i) => i.orderId)));
  const orderRows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalCents: orders.totalCents,
      notes: orders.notes,
      createdAt: orders.createdAt,
      buyerName: users.name,
      buyerEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .where(inArray(orders.id, orderIds))
    .orderBy(desc(orders.createdAt));

  // 3. Group seller items by order
  const itemsByOrder = new Map<string, typeof sellerItems>();
  for (const item of sellerItems) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  // 4. Compute seller's subtotal per order (only their items, not the buyer's full order total)
  const data = orderRows.map((o) => {
    const items = itemsByOrder.get(o.id) ?? [];
    const sellerSubtotalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    return {
      ...o,
      items,
      sellerSubtotalCents,
    };
  });

  return NextResponse.json({ success: true, data });
}
