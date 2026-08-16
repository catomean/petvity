import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderStatusEnum } from "@/lib/db/schema";
import { setOrderStatus } from "@/lib/domain/orders";

const patchSchema = z.object({
  status: z.enum(orderStatusEnum.enumValues),
});

type Params = { params: Promise<{ orderId: string }> };

/** PATCH /api/orders/[orderId] — update order status (admin confirms/ships/delivers; user cancels pending).
 *  This route decides WHO may make the transition; lib/domain/orders.ts decides
 *  what the transition does. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { orderId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status } = parsed.data;
  const isAdmin = session.user.role === "admin";

  const db = getInstance();

  // A guest order's null userId can never equal a session id, so this filter
  // also stops a signed-in user from touching an order they merely know of.
  const [order] = await db
    .select()
    .from(orders)
    .where(
      isAdmin
        ? eq(orders.id, orderId)
        : and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
    )
    .limit(1);

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  // Non-admins can only cancel their own pending orders
  if (!isAdmin && status !== "cancelled") {
    return NextResponse.json(
      { success: false, error: "You can only cancel your own orders" },
      { status: 403 },
    );
  }
  if (!isAdmin && order.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "Only pending orders can be cancelled" },
      { status: 400 },
    );
  }

  const updated = await setOrderStatus(order, status);
  return NextResponse.json({ success: true, data: updated });
}
