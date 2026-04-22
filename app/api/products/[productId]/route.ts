import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
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

/** PATCH /api/products/[productId] — update product (admin only) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
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
  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

/** DELETE /api/products/[productId] — soft-delete (deactivate) product (admin only) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { productId } = await params;
  const db = getInstance();
  const [updated] = await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
