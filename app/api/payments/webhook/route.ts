import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { getStripe, paymentsEnabled } from "@/lib/payments/stripe";

/**
 * Stripe webhook — the single source of truth for payment state.
 * Self-authenticates via the stripe-signature header (STRIPE_WEBHOOK_SECRET),
 * so it stays outside the middleware auth guard like /api/cron/*.
 */
export async function POST(req: NextRequest) {
  if (!paymentsEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, error: "Payments not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();
  let event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      const db = getInstance();
      // Idempotent: repeated deliveries keep the first paidAt.
      await db
        .update(orders)
        .set({ paidAt: new Date(), status: "confirmed", updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), isNull(orders.paidAt)));
    }
  }

  return NextResponse.json({ received: true });
}
