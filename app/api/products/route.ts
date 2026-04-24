import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { products, productCategoryEnum } from "@/lib/db/schema";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(1),
  imageUrl: z.string().url().nullable().optional(),
  category: z.enum(productCategoryEnum.enumValues).optional(),
  stock: z.number().int().min(0).nullable().optional(),
});

/** GET /api/products — list active products (public) */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");

  const db = getInstance();
  const rows = await db
    .select()
    .from(products)
    .where(
      category
        ? and(eq(products.isActive, true), eq(products.category, category as typeof productCategoryEnum.enumValues[number]))
        : eq(products.isActive, true),
    )
    .orderBy(products.name);

  return NextResponse.json({ success: true, data: rows });
}

/** POST /api/products — create product (admin only) */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const [product] = await db.insert(products).values(parsed.data).returning();
  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
