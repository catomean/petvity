import Stripe from "stripe";
import { APP_CURRENCY, APP_URL } from "@/lib/config/app";

/**
 * Stripe payments — enabled only when STRIPE_SECRET_KEY is set (same pattern
 * as Resend email). Without the key, checkout falls back to the recorded-order
 * flow and nothing about the current behavior changes.
 *
 * Env: STRIPE_SECRET_KEY (server key), STRIPE_WEBHOOK_SECRET (webhook
 * signature verification for /api/payments/webhook).
 */

export function paymentsEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/** Lazy singleton — never constructed at build time or when payments are off. */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}

export type CheckoutLineItem = {
  name: string;
  unitAmountCents: number;
  quantity: number;
};

/**
 * Create a Checkout Session for an order. Returns the hosted payment URL.
 * The webhook (checkout.session.completed) marks the order paid — the
 * success redirect is cosmetic, never trusted as payment proof.
 */
export async function createOrderCheckoutSession(opts: {
  orderId: string;
  customerEmail: string | null;
  items: CheckoutLineItem[];
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: opts.customerEmail ?? undefined,
    line_items: opts.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: APP_CURRENCY.toLowerCase(),
        unit_amount: i.unitAmountCents,
        product_data: { name: i.name },
      },
    })),
    metadata: { orderId: opts.orderId },
    success_url: `${APP_URL}/portal/orders?payment=success`,
    cancel_url: `${APP_URL}/portal/orders?payment=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { sessionId: session.id, url: session.url };
}
