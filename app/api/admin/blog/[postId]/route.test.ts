import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { makeMockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { PATCH, DELETE } from "./route";
import { requireAdmin } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const POST_ID = "00000000-0000-4000-8000-0000000000aa";
const CONTEXT = { params: Promise.resolve({ postId: POST_ID }) };
const FIRST_PUBLISH = new Date("2026-08-13T00:00:00Z");

function req(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/blog/${POST_ID}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

let db: ReturnType<typeof makeMockDb>;

/** What the route passed to .set() on the update. */
function updatedWith() {
  const setFn = (db.update as unknown as () => { set: { mock: { calls: unknown[][] } } })().set;
  return setFn.mock.calls[0][0] as Record<string, unknown>;
}

beforeEach(() => {
  db = makeMockDb();
  vi.mocked(getInstance).mockReturnValue(db as never);
  vi.mocked(requireAdmin).mockResolvedValue({
    session: { user: { id: "admin-1", role: "admin" } },
    error: null,
  } as never);
  db._updateReturning.mockResolvedValue([{ id: POST_ID }]);
});

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("PATCH /api/admin/blog/[postId]", () => {
  it("refuses a non-admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    } as never);
    const res = await PATCH(req({ title: "x" }), CONTEXT);
    expect(res.status).toBe(403);
  });

  it("404s an unknown post", async () => {
    db._queryFindFirst.mockResolvedValueOnce(undefined);
    const res = await PATCH(req({ title: "x" }), CONTEXT);
    expect(res.status).toBe(404);
  });

  it("stamps publishedAt on the first publish", async () => {
    db._queryFindFirst.mockResolvedValueOnce({
      id: POST_ID, status: "draft", publishedAt: null,
    });
    await PATCH(req({ status: "published" }), CONTEXT);
    expect(updatedWith().publishedAt).toBeInstanceOf(Date);
  });

  // The date readers see. Unpublishing to fix a typo and publishing again must
  // not silently move the post to today and re-order the whole index.
  it("keeps the original date when a post is published again", async () => {
    db._queryFindFirst.mockResolvedValueOnce({
      id: POST_ID, status: "draft", publishedAt: FIRST_PUBLISH,
    });
    await PATCH(req({ status: "published" }), CONTEXT);
    expect(updatedWith().publishedAt).toEqual(FIRST_PUBLISH);
  });

  it("keeps the date when unpublishing, so republishing restores it", async () => {
    db._queryFindFirst.mockResolvedValueOnce({
      id: POST_ID, status: "published", publishedAt: FIRST_PUBLISH,
    });
    await PATCH(req({ status: "draft" }), CONTEXT);
    expect(updatedWith().publishedAt).toEqual(FIRST_PUBLISH);
  });

  it("does not publish a draft merely because its text was edited", async () => {
    db._queryFindFirst.mockResolvedValueOnce({
      id: POST_ID, status: "draft", publishedAt: null,
    });
    await PATCH(req({ body: "new text" }), CONTEXT);
    expect(updatedWith().publishedAt).toBeNull();
  });

  it("rejects a slug that would not survive a URL", async () => {
    db._queryFindFirst.mockResolvedValueOnce({ id: POST_ID, status: "draft", publishedAt: null });
    const res = await PATCH(req({ slug: "Not A Slug!" }), CONTEXT);
    expect(res.status).toBe(400);
  });

  it("reports a taken slug as a conflict, not a server error", async () => {
    db._queryFindFirst.mockResolvedValueOnce({ id: POST_ID, status: "draft", publishedAt: null });
    // Wrapped, as Drizzle actually throws it — a bare { code } passed this test
    // while production still answered 500.
    db._updateReturning.mockRejectedValueOnce(
      Object.assign(new Error("Failed query"), {
        cause: Object.assign(new Error("duplicate key"), { code: "23505" }),
      }),
    );
    const res = await PATCH(req({ slug: "taken" }), CONTEXT);
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/admin/blog/[postId]", () => {
  it("deletes a post", async () => {
    db._deleteReturning.mockResolvedValueOnce([{ id: POST_ID }]);
    const res = await DELETE(req({}), CONTEXT);
    expect(res.status).toBe(200);
  });

  it("404s when there was nothing to delete", async () => {
    db._deleteReturning.mockResolvedValueOnce([]);
    const res = await DELETE(req({}), CONTEXT);
    expect(res.status).toBe(404);
  });

  it("refuses a non-admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      session: null,
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    } as never);
    const res = await DELETE(req({}), CONTEXT);
    expect(res.status).toBe(403);
  });
});
