import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { products, productCategoryEnum, users } from "@/lib/db/schema";

/** Filter `?ids=` to well-formed uuids before they reach the query — a bad id
 *  is a client bug, not a reason to 500. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A cart bigger than this is a script; no shopper picks 50 distinct products. */
const MAX_IDS = 50;

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(1),
  imageUrl: z.string().url().nullable().optional(),
  category: z.enum(productCategoryEnum.enumValues).optional(),
  stock: z.number().int().min(0).nullable().optional(),
});

/** GET /api/products — list active products (public)
 *  ?mine=true   → authenticated user's own listings (all statuses)
 *  ?category=X  → filter by category (public, active only)
 *  ?ids=a,b,c   → exactly these products (public, active only)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mine = searchParams.get("mine") === "true";
  const category = searchParams.get("category");
  const idsParam = searchParams.get("ids");

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

  // The guest cart holds product ids only, so the checkout page prices it here
  // rather than trusting whatever localStorage remembered. Unknown or
  // deactivated ids simply come back missing — the cart page shows them as
  // unavailable instead of silently charging for them.
  if (idsParam !== null) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s))
      .slice(0, MAX_IDS);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

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
      .where(and(eq(products.isActive, true), inArray(products.id, ids)));

    return NextResponse.json({ success: true, data: rows });
  }

  // Public: active products only (platform + seller listings) with seller name for trust
  const PAGE = 100; // products are browsed with category filter; 100 is generous per category
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
    .orderBy(products.name)
    .limit(PAGE);

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
