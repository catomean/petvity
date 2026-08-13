import { NextRequest, NextResponse } from "next/server";
import { eq, desc, inArray, sql, gte, and, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { orderConfirmation, sellerOrderNotification } from "@/lib/email/templates";
import { formatPrice } from "@/lib/utils/format";
import { paymentsEnabled, createOrderCheckoutSession } from "@/lib/payments/stripe";

const createSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(99),
    }),
  ).min(1),
  notes: z.string().max(500).optional(),
});

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

/** POST /api/orders — place an order */
export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { items, notes } = parsed.data;
  const productIds = items.map((i) => i.productId);

  const db = getInstance();

  // Fetch all requested products in one query
  const productRows = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  // Validate: all products must be active and found
  const productMap = new Map(productRows.map((p) => [p.id, p]));
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product ${item.productId} not found` },
        { status: 404 },
      );
    }
    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: `Product "${product.name}" is no longer available` },
        { status: 400 },
      );
    }
    if (product.stock !== null && product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock for "${product.name}"` },
        { status: 400 },
      );
    }
  }

  // Calculate total
  const totalCents = items.reduce((sum, item) => {
    const p = productMap.get(item.productId)!;
    return sum + p.priceCents * item.quantity;
  }, 0);

  // Atomically decrement finite-stock items BEFORE creating the order.
  // WHERE stock >= quantity ensures only one concurrent request can win per product —
  // if two requests race on the last unit, only one UPDATE row count > 0.
  const stockDecrements = items
    .filter((item) => productMap.get(item.productId)!.stock !== null)
    .map((item) => ({ productId: item.productId, quantity: item.quantity }));

  if (stockDecrements.length > 0) {
    const decrementResults = await Promise.all(
      stockDecrements.map(({ productId, quantity }) =>
        db
          .update(products)
          .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
          .where(and(eq(products.id, productId), gte(products.stock, quantity)))
          .returning({ id: products.id }),
      ),
    );

    const failedIdx = decrementResults.findIndex((r) => r.length === 0);
    if (failedIdx !== -1) {
      // Compensate: restore stock for any products already decremented in this batch
      const toRestore = stockDecrements.filter((_, i) => i !== failedIdx && decrementResults[i].length > 0);
      if (toRestore.length > 0) {
        await Promise.all(
          toRestore.map(({ productId, quantity }) =>
            db
              .update(products)
              .set({ stock: sql`${products.stock} + ${quantity}`, updatedAt: new Date() })
              .where(eq(products.id, productId)),
          ),
        );
      }
      const failedProduct = productMap.get(stockDecrements[failedIdx].productId);
      return NextResponse.json(
        { success: false, error: `"${failedProduct?.name ?? "A product"}" just sold out. Please refresh your cart.` },
        { status: 409 },
      );
    }
  }

  // Stock reserved — now safe to record the order
  const [order] = await db
    .insert(orders)
    .values({ userId: session.user.id, totalCents, notes: notes ?? null })
    .returning();

  const itemValues = items.map((item) => ({
    orderId: order.id,
    productId: item.productId,
    productName: productMap.get(item.productId)!.name,
    quantity: item.quantity,
    priceCents: productMap.get(item.productId)!.priceCents,
  }));

  const insertedItems = await db.insert(orderItems).values(itemValues).returning();

  // Look up the buyer once; reused for buyer confirmation + seller notifications
  const [buyer] = await db
    .select({ name: users.name, email: users.email, locale: users.locale })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const buyerLabel = buyer?.name ?? buyer?.email ?? "A customer";

  // Send order confirmation email to buyer (fire-and-forget)
  try {
    if (buyer?.email) {
      const emailItems = insertedItems.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        lineTotal: formatPrice(i.priceCents * i.quantity),
      }));
      const tpl = orderConfirmation({
        customerName: buyerLabel,
        orderTotal: formatPrice(totalCents),
        items: emailItems,
        notes: notes ?? null,
      }, buyer.locale);
      await sendEmail({ to: buyer.email, ...tpl });
    }
  } catch {
    // Never fail the order response due to email error
  }

  // Notify sellers whose products were ordered (fire-and-forget, one email per seller)
  try {
    const itemsBySeller = new Map<string, typeof insertedItems>();
    for (const item of insertedItems) {
      const sellerId = (item.productId ? productMap.get(item.productId)?.sellerId : null) ?? null;
      if (!sellerId) continue;
      const arr = itemsBySeller.get(sellerId) ?? [];
      arr.push(item);
      itemsBySeller.set(sellerId, arr);
    }

    if (itemsBySeller.size > 0) {
      const sellerRows = await db
        .select({ id: users.id, name: users.name, email: users.email, locale: users.locale })
        .from(users)
        .where(inArray(users.id, Array.from(itemsBySeller.keys())));

      await Promise.all(
        sellerRows.map(async (seller) => {
          if (!seller.email) return;
          const sellerItems = itemsBySeller.get(seller.id) ?? [];
          const subtotalCents = sellerItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);
          const tpl = sellerOrderNotification({
            sellerName: seller.name ?? seller.email,
            buyerName: buyerLabel,
            items: sellerItems.map((i) => ({
              name: i.productName,
              quantity: i.quantity,
              lineTotal: formatPrice(i.priceCents * i.quantity),
            })),
            subtotal: formatPrice(subtotalCents),
          }, seller.locale);
          await sendEmail({ to: seller.email, ...tpl });
        }),
      );
    }
  } catch {
    // Never fail the order response due to email error
  }

  // Payments configured → hand the buyer to Stripe Checkout. The webhook marks
  // the order paid; a session failure never loses the order (it stays payable
  // from the orders page).
  let checkoutUrl: string | null = null;
  if (paymentsEnabled()) {
    try {
      const checkout = await createOrderCheckoutSession({
        orderId: order.id,
        customerEmail: buyer?.email ?? null,
        items: insertedItems.map((i) => ({
          name: i.productName,
          unitAmountCents: i.priceCents,
          quantity: i.quantity,
        })),
      });
      await db
        .update(orders)
        .set({ checkoutSessionId: checkout.sessionId, updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      checkoutUrl = checkout.url;
    } catch (e) {
      console.error("Stripe checkout session failed for order", order.id, e);
    }
  }

  return NextResponse.json(
    { success: true, data: { ...order, items: insertedItems, checkoutUrl } },
    { status: 201 },
  );
}
