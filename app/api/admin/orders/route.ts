import { NextResponse } from "next/server";
import { desc, inArray, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products, users } from "@/lib/db/schema";

const sellers = alias(users, "sellers");

/** GET /api/admin/orders — all orders with items + customer info */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();

  const allOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalCents: orders.totalCents,
      notes: orders.notes,
      shippingName: orders.shippingName,
      shippingLine1: orders.shippingLine1,
      shippingPostalCode: orders.shippingPostalCode,
      shippingCity: orders.shippingCity,
      shippingCountry: orders.shippingCountry,
      shippingPhone: orders.shippingPhone,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customer: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(500);

  if (allOrders.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const orderIds = allOrders.map((o) => o.id);
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
      sellerId: products.sellerId,
      sellerName: sellers.name,
      sellerEmail: sellers.email,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(sellers, eq(sellers.id, products.sellerId))
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  const data = allOrders.map((o) => ({
    ...o,
    items: itemsByOrder.get(o.id) ?? [],
  }));

  return NextResponse.json({ success: true, data });
}
