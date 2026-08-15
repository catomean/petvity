import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { blogPostUpdateSchema } from "@/lib/domain/blog";
import { isUniqueViolation } from "@/lib/db/errors";

type Params = { params: Promise<{ postId: string }> };

/** PATCH /api/admin/blog/[postId] — edit, publish, or unpublish. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { postId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = blogPostUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const existing = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, postId),
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // publishedAt is the date readers see, so it is stamped once — on the first
  // publish — and preserved afterwards. Re-publishing a post that was
  // temporarily unpublished must not silently re-date it to today.
  const nextStatus = parsed.data.status ?? existing.status;
  const publishedAt =
    nextStatus === "published" ? (existing.publishedAt ?? new Date()) : existing.publishedAt;

  try {
    const [post] = await db
      .update(blogPosts)
      .set({ ...parsed.data, publishedAt, updatedAt: new Date() })
      .where(eq(blogPosts.id, postId))
      .returning();

    return NextResponse.json({ success: true, data: post });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { success: false, error: "A post with that URL already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}

/** DELETE /api/admin/blog/[postId] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { postId } = await params;
  const db = getInstance();

  const [deleted] = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, postId))
    .returning({ id: blogPosts.id });

  if (!deleted) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
