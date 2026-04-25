import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { products, productCategoryEnum, users } from "@/lib/db/schema";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(1),
  imageUrl: z.string().url().nullable().optional(),
  category: z.enum(productCategoryEnum.enumValues).optional(),
  stock: z.number().int().min(0).nullable().optional(),
});

/** GET /api/products — list active products (public)
 *  ?mine=true  → authenticated user's own listings (all statuses)
 *  ?category=X → filter by category (public, active only)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mine = searchParams.get("mine") === "true";
  const category = searchParams.get("category");

  const db = getInstance();

  if (mine) {
    const { session, error } = await requireSession();
    if (error) return error;
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, session.user.id))
      .orderBy(products.createdAt);
    return NextResponse.json({ success: true, data: rows });
  }

  // Public: active products only (platform + seller listings) with seller name for trust
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
      stock: products.stock,
      sellerId: products.sellerId,
      sellerName: users.name,
    })
    .from(products)
    .leftJoin(users, eq(users.id, products.sellerId))
    .where(
      category
        ? and(
            eq(products.isActive, true),
            eq(products.category, category as typeof productCategoryEnum.enumValues[number]),
          )
        : eq(products.isActive, true),
    )
    .orderBy(products.name);

  return NextResponse.json({ success: true, data: rows });
}

/** POST /api/products — create product
 *  Any authenticated user can list a product (sellerId = their userId).
 *  Admins can also create platform products (sellerId = null via ?platform=true).
 */
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

  const isAdmin = session.user.role === "admin";
  const platformProduct = isAdmin && req.nextUrl.searchParams.get("platform") === "true";

  const db = getInstance();
  const [product] = await db
    .insert(products)
    .values({
      ...parsed.data,
      sellerId: platformProduct ? null : session.user.id,
    })
    .returning();

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
