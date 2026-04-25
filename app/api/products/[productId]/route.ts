import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { products, productCategoryEnum } from "@/lib/db/schema";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  priceCents: z.number().int().min(1).optional(),
  imageUrl: z.string().url().nullable().optional(),
  category: z.enum(productCategoryEnum.enumValues).optional(),
  stock: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ productId: string }> };

/** PATCH /api/products/[productId] — update product (owner or admin) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const isAdmin = session.user.role === "admin";

  // Owner can update their own listings; admin can update any product
  const whereClause = isAdmin
    ? eq(products.id, productId)
    : and(eq(products.id, productId), eq(products.sellerId, session.user.id));

  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(whereClause)
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE /api/products/[productId] — soft-delete (owner or admin) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { productId } = await params;
  const db = getInstance();
  const isAdmin = session.user.role === "admin";

  const whereClause = isAdmin
    ? eq(products.id, productId)
    : and(eq(products.id, productId), eq(products.sellerId, session.user.id));

  const [updated] = await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(whereClause)
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
