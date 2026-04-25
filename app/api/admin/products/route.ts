import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { products, users } from "@/lib/db/schema";

/** GET /api/admin/products — all products (active + inactive) with optional seller info */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
      stock: products.stock,
      isActive: products.isActive,
      sellerId: products.sellerId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(products)
    .leftJoin(users, eq(users.id, products.sellerId))
    .orderBy(desc(products.createdAt));

  return NextResponse.json({ success: true, data: rows });
}
