import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products, users, orderStatusEnum } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import {
  orderConfirmation,
  orderStatusUpdate,
  sellerOrderNotification,
} from "@/lib/email/templates";
import { formatPrice } from "@/lib/utils/format";
import { paymentsEnabled, createOrderCheckoutSession } from "@/lib/payments/stripe";
import { APP_URL } from "@/lib/config/app";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";
import { isCountryCode } from "@/lib/config/countries";
import { DEFAULT_LOCALE, LOCALE_CONFIG } from "@/lib/config/locales";
import { reserveAll, releaseAll } from "@/packages/commercekit/src/inventory";
import { drizzleInventory } from "@/lib/domain/inventory";

/* ─── Input shapes (SSOT — both the authed and the guest route validate with these) ── */

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

/** Delivery details — required so an order can actually be fulfilled. */
export const orderShippingSchema = z.object({
  shippingName: z.string().min(1).max(200),
  shippingLine1: z.string().min(1).max(200),
  shippingPostalCode: z.string().min(1).max(20),
  shippingCity: z.string().min(1).max(100),
  // Checked against the ISO list, not just the length: "XX" would otherwise be
  // stored and then printed on a shipping label nobody can deliver to.
  shippingCountry: z.string().length(2).refine(isCountryCode, { message: "Unknown country" }),
  shippingPhone: z.string().max(50).nullish(),
});

export const orderCreateSchema = orderShippingSchema.extend({
  items: z.array(orderItemSchema).min(1),
  notes: z.string().max(500).optional(),
});

/** The guest form asks for everything above plus the email the receipt goes to,
 *  and the storefront language it should be written in. */
export const guestOrderCreateSchema = orderCreateSchema.extend({
  email: z.string().email().max(255),
  locale: z.string().max(10).optional(),
});

/* ─── Result ──────────────────────────────────────────────────────────────── */

/**
 * Who is buying. A guest has no row in `users`, so every downstream consumer
 * (emails, seller notifications, Stripe) has to take the address from here
 * rather than looking one up.
 */
export type OrderBuyer = { kind: "account"; userId: string } | { kind: "guest"; email: string };

export type PlaceOrderInput = z.infer<typeof orderCreateSchema> & {
  buyer: OrderBuyer;
  /** The storefront language the buyer is shopping in — where Stripe returns
   *  them and which receipt link their email carries. */
  locale?: string;
};

export type PlaceOrderFailure = { ok: false; status: number; error: string };
export type PlaceOrderSuccess = {
  ok: true;
  order: typeof orders.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
  checkoutUrl: string | null;
};
export type PlaceOrderResult = PlaceOrderSuccess | PlaceOrderFailure;

/** Path a guest reads their own order back at. Unguessable, emailed, never listed. */
export function guestOrderPath(publicToken: string, locale: string = DEFAULT_LOCALE): string {
  return `/${locale}/shop/order/${publicToken}`;
}

/** Absolute form of {@link guestOrderPath}, for emails and Stripe redirects. */
export function guestOrderUrl(publicToken: string, locale: string = DEFAULT_LOCALE): string {
  return `${APP_URL}${guestOrderPath(publicToken, locale)}`;
}

/**
 * Narrow an untrusted locale from a request body to one we actually serve.
 *
 * `Object.hasOwn`, not `in`: `"constructor" in LOCALE_CONFIG` is true through
 * the prototype chain, and the result of this goes straight into a URL.
 */
export function toLocale(value: unknown): string {
  return typeof value === "string" && Object.hasOwn(LOCALE_CONFIG, value) ? value : DEFAULT_LOCALE;
}

/* ─── Status transitions ──────────────────────────────────────────────────── */

/**
 * Move an order to a new status, release stock if it was cancelled, and tell
 * the buyer.
 *
 * Authorisation is the caller's job — who may make which transition differs by
 * entry point (an admin may do anything; a buyer may only cancel while
 * pending). What must NOT differ is the consequences, which is why they live
 * here: a cancellation that forgot to restore stock would destroy inventory
 * permanently, and one route remembering while another forgets is exactly how
 * that happens.
 */
export async function setOrderStatus(
  order: typeof orders.$inferSelect,
  status: (typeof orderStatusEnum.enumValues)[number],
): Promise<typeof orders.$inferSelect> {
  const db = getInstance();

  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, order.id))
    .returning();

  // Only on the transition INTO cancelled — cancelling an already-cancelled
  // order twice would hand back the stock twice, inventing units from nothing.
  if (status === "cancelled" && order.status !== "cancelled") {
    const cancelledItems = await db
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    const result = await releaseAll(
      drizzleInventory(db),
      cancelledItems
        .filter((i) => i.productId !== null)
        .map((i) => ({ sku: i.productId!, quantity: i.quantity })),
    );
    if (result.failed.length > 0) {
      console.error(
        `Order ${order.id} cancelled but stock was not restored for:`,
        result.failed.map((f) => `${f.sku} x${f.quantity}`).join(", "),
      );
    }
  }

  if ((STATUS_EMAIL_STATUSES as readonly string[]).includes(status)) {
    try {
      // A guest order has no users row: the address they typed at checkout is
      // the only way to reach them, and their receipt link the only way back.
      const [customer] = order.userId
        ? await db
            .select({ name: users.name, email: users.email, locale: users.locale })
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1)
        : [
            {
              name: order.shippingName,
              email: order.guestEmail,
              locale: null as string | null,
            },
          ];

      if (customer?.email) {
        const tpl = orderStatusUpdate(
          {
            customerName: customer.name ?? customer.email,
            status: status as (typeof STATUS_EMAIL_STATUSES)[number],
            orderTotal: formatPrice(order.totalCents),
            orderUrl: order.userId
              ? null
              : guestOrderUrl(order.publicToken, customer.locale ?? DEFAULT_LOCALE),
          },
          customer.locale,
        );
        await sendEmail({ to: customer.email, ...tpl });
      }
    } catch {
      // Never fail the status change because an email failed.
    }
  }

  return updated;
}

/** Transitions worth an email. A move between two internal states is noise. */
export const STATUS_EMAIL_STATUSES = ["confirmed", "shipped", "delivered", "cancelled"] as const;

/* ─── Resuming payment ────────────────────────────────────────────────────── */

export type StartCheckoutResult =
  { ok: true; checkoutUrl: string | null } | { ok: false; status: number; error: string };

/**
 * (Re)open a Stripe Checkout session for an order that is already recorded.
 *
 * Covers the buyer closing the Stripe tab: the order and its stock reservation
 * survive, and this is how they get back to paying. Shared by the portal's
 * "Pay" button and a guest's receipt link, which differ only in how they prove
 * the order is theirs.
 */
export async function startCheckoutForOrder(
  order: typeof orders.$inferSelect,
  customerEmail: string | null,
  returnPath: string,
): Promise<StartCheckoutResult> {
  if (!paymentsEnabled()) {
    return { ok: false, status: 503, error: "Payments are not enabled" };
  }
  if (order.paidAt) {
    return { ok: false, status: 400, error: "Order is already paid" };
  }
  if (order.status === "cancelled") {
    return { ok: false, status: 400, error: "Order was cancelled" };
  }

  const db = getInstance();
  const items = await db
    .select({
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      productName: orderItems.productName,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const checkout = await createOrderCheckoutSession({
    orderId: order.id,
    customerEmail,
    items: items.map((i) => ({
      name: i.productName,
      unitAmountCents: i.priceCents,
      quantity: i.quantity,
    })),
    returnPath,
  });

  await db
    .update(orders)
    .set({ checkoutSessionId: checkout.sessionId, updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  return { ok: true, checkoutUrl: checkout.url };
}

/* ─── Placement ───────────────────────────────────────────────────────────── */

/**
 * Record an order: validate availability, reserve stock, write the rows, notify
 * everyone, and (when payments are on) open a Stripe Checkout session.
 *
 * Lives in the domain rather than the route because two HTTP entry points reach
 * it — the authed portal cart and the public guest checkout — and the stock
 * reservation below is the part that must not be reimplemented twice.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { items, notes, buyer, locale, ...shipping } = input;
  const storefrontLocale = toLocale(locale);
  const db = getInstance();

  const productRows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        items.map((i) => i.productId),
      ),
    );

  const productMap = new Map(productRows.map((p) => [p.id, p]));
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { ok: false, status: 404, error: `Product ${item.productId} not found` };
    }
    if (!product.isActive) {
      return { ok: false, status: 400, error: `"${product.name}" is no longer available` };
    }
    if (product.stock !== null && product.stock < item.quantity) {
      return { ok: false, status: 400, error: `Insufficient stock for "${product.name}"` };
    }
  }

  const totalCents = items.reduce(
    (sum, item) => sum + productMap.get(item.productId)!.priceCents * item.quantity,
    0,
  );

  // Reserve stock BEFORE creating the order, all-or-nothing. The algorithm —
  // conditional decrement, compensation on partial failure, sorted lock order,
  // merged duplicate lines — lives in commercekit because every shop in the
  // fleet needs exactly this and it is the easiest thing here to get subtly
  // wrong. What stays Petvity's is the adapter: how a product's stock is read
  // and written.
  const reservation = await reserveAll(
    drizzleInventory(db),
    items.map((i) => ({ sku: i.productId, quantity: i.quantity })),
  );

  if (!reservation.ok) {
    if (!reservation.compensated) {
      // Stock exists but nobody can buy it. Never swallow this.
      console.error(
        "Stock stranded after a failed reservation:",
        reservation.stranded.map((s) => `${s.sku} x${s.quantity}`).join(", "),
      );
    }
    const failedProduct = productMap.get(reservation.failed.sku);
    return {
      ok: false,
      status: 409,
      error: `"${failedProduct?.name ?? "A product"}" just sold out. Please refresh your cart.`,
    };
  }

  // Stock reserved — now safe to record the order
  const [order] = await db
    .insert(orders)
    .values({
      userId: buyer.kind === "account" ? buyer.userId : null,
      guestEmail: buyer.kind === "guest" ? buyer.email.toLowerCase() : null,
      totalCents,
      notes: notes ?? null,
      shippingName: shipping.shippingName,
      shippingLine1: shipping.shippingLine1,
      shippingPostalCode: shipping.shippingPostalCode,
      shippingCity: shipping.shippingCity,
      shippingCountry: shipping.shippingCountry.toUpperCase(),
      shippingPhone: shipping.shippingPhone ?? null,
    })
    .returning();

  const insertedItems = await db
    .insert(orderItems)
    .values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: productMap.get(item.productId)!.name,
        quantity: item.quantity,
        priceCents: productMap.get(item.productId)!.priceCents,
      })),
    )
    .returning();

  // Resolve the buyer's contact details once — reused for their confirmation,
  // the seller notifications and Stripe. A guest has only what they typed.
  let buyerEmail: string | null = null;
  let buyerLocale: string | null = null;
  let buyerLabel = shipping.shippingName;

  if (buyer.kind === "account") {
    const [row] = await db
      .select({ name: users.name, email: users.email, locale: users.locale })
      .from(users)
      .where(eq(users.id, buyer.userId))
      .limit(1);
    buyerEmail = row?.email ?? null;
    buyerLocale = row?.locale ?? null;
    buyerLabel = row?.name ?? row?.email ?? shipping.shippingName;
  } else {
    buyerEmail = buyer.email;
  }

  const emailItems = insertedItems.map((i) => ({
    name: i.productName,
    quantity: i.quantity,
    lineTotal: formatPrice(i.priceCents * i.quantity),
  }));

  // Buyer confirmation (fire-and-forget — never fail the order on an email error)
  try {
    if (buyerEmail) {
      const tpl = orderConfirmation(
        {
          customerName: buyerLabel,
          orderTotal: formatPrice(totalCents),
          items: emailItems,
          notes: notes ?? null,
          // A guest cannot sign in to find this order again, so the receipt link
          // is the only route back to it. Omitted for account orders, which have
          // /portal/orders.
          orderUrl:
            buyer.kind === "guest"
              ? guestOrderUrl(order.publicToken, buyerLocale ?? storefrontLocale)
              : null,
        },
        buyerLocale,
      );
      await sendEmail({ to: buyerEmail, ...tpl });
    }
  } catch {
    // Never fail the order response due to email error
  }

  // Notify sellers whose products were ordered (one email per seller)
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
          const tpl = sellerOrderNotification(
            {
              sellerName: seller.name ?? seller.email,
              buyerName: buyerLabel,
              items: sellerItems.map((i) => ({
                name: i.productName,
                quantity: i.quantity,
                lineTotal: formatPrice(i.priceCents * i.quantity),
              })),
              subtotal: formatPrice(subtotalCents),
            },
            seller.locale,
          );
          await sendEmail({ to: seller.email, ...tpl });
        }),
      );
    }
  } catch {
    // Never fail the order response due to email error
  }

  // Payments configured → hand the buyer to Stripe Checkout. The webhook marks
  // the order paid; a session failure never loses the order (it stays payable
  // from the orders page, or from the guest's receipt link).
  let checkoutUrl: string | null = null;
  if (paymentsEnabled()) {
    try {
      const checkout = await createOrderCheckoutSession({
        orderId: order.id,
        customerEmail: buyerEmail,
        items: insertedItems.map((i) => ({
          name: i.productName,
          unitAmountCents: i.priceCents,
          quantity: i.quantity,
        })),
        // A guest has no portal to return to.
        returnPath:
          buyer.kind === "guest"
            ? guestOrderPath(order.publicToken, storefrontLocale)
            : "/portal/orders",
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

  return { ok: true, order, items: insertedItems, checkoutUrl };
}
