import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { blogPostCreateSchema } from "@/lib/domain/blog";
import { isUniqueViolation } from "@/lib/db/errors";

/** GET /api/admin/blog — every post, drafts included. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getInstance();
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));

  return NextResponse.json({ success: true, data: rows });
}

/** POST /api/admin/blog — create a post. */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = blogPostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getInstance();
  const status = parsed.data.status ?? "draft";

  try {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...parsed.data,
        status,
        // Stamped only when it actually goes public, so a draft never carries a
        // publication date it hasn't earned.
        publishedAt: status === "published" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (e) {
    // The slug is the public URL, so a collision is a user-correctable mistake,
    // not a server fault.
    if (isUniqueViolation(e)) {
      return NextResponse.json(
        { success: false, error: "A post with that URL already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}
