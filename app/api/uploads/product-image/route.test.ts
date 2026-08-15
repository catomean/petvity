import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  putLocal: vi.fn().mockResolvedValue({ url: "/uploads/products/seller-1/abc123" }),
}));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { POST } from "./route";
import { requireSession } from "@/lib/auth/guards";
import { putLocal } from "@/lib/storage";
import { IMAGE_MAX_BYTES } from "@/lib/config/uploads";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const SESSION = {
  user: { id: "seller-1", role: "pet_owner", email: "seller@example.com", name: "Seller" },
  expires: "2099-01-01",
};

/** A File with real content of the given length. The size has to be genuine:
 *  FormData rebuilds the File from its bytes, so a patched `size` property is
 *  discarded in transit and the size gate would never be exercised. */
function fileOfSize(bytes: number, type = "image/jpeg") {
  return new File([new Uint8Array(bytes)], "photo.jpg", { type });
}

function request(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new NextRequest("http://localhost/api/uploads/product-image", {
    method: "POST",
    body: form,
  });
}

beforeEach(() => {
  vi.mocked(requireSession).mockResolvedValue({ session: SESSION, error: null } as never);
  vi.mocked(putLocal).mockClear();
});

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("POST /api/uploads/product-image", () => {
  it("stores the file and returns its URL", async () => {
    const res = await POST(request(fileOfSize(1024)));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      data: { url: "/uploads/products/seller-1/abc123" },
    });
  });

  it("keys the upload by uploader so an abandoned file is traceable", async () => {
    await POST(request(fileOfSize(1024)));
    expect(vi.mocked(putLocal).mock.calls[0][0]).toMatch(/^products\/seller-1\//);
  });

  // Caddy's file_server derives Content-Type from the extension. Stored without
  // one, prod served the image with an empty Content-Type — Chrome sniffs it,
  // but that is a courtesy, not a guarantee.
  it.each([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["image/gif", ".gif"],
  ])("stores %s under a %s extension so it is served with a Content-Type", async (type, ext) => {
    await POST(request(fileOfSize(1024, type)));
    expect(vi.mocked(putLocal).mock.calls[0][0]).toMatch(new RegExp(`\\${ext}$`));
  });

  it("refuses an anonymous upload", async () => {
    // Writing files to disk without a session is how an open endpoint becomes
    // someone else's free storage.
    vi.mocked(requireSession).mockResolvedValue({
      session: null,
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    } as never);
    const res = await POST(request(fileOfSize(1024)));
    expect(res.status).toBe(401);
    expect(putLocal).not.toHaveBeenCalled();
  });

  it("rejects a request with no file", async () => {
    const res = await POST(request());
    expect(res.status).toBe(400);
    expect(putLocal).not.toHaveBeenCalled();
  });

  it("rejects an image over the size cap", async () => {
    const res = await POST(request(fileOfSize(IMAGE_MAX_BYTES + 1)));
    expect(res.status).toBe(413);
    expect(putLocal).not.toHaveBeenCalled();
  });

  it("accepts an image exactly at the cap", async () => {
    const res = await POST(request(fileOfSize(IMAGE_MAX_BYTES)));
    expect(res.status).toBe(200);
  });

  it("rejects a non-image content type", async () => {
    const res = await POST(request(fileOfSize(1024, "application/pdf")));
    expect(res.status).toBe(415);
    expect(putLocal).not.toHaveBeenCalled();
  });

  it("reports a storage failure instead of pretending it saved", async () => {
    vi.mocked(putLocal).mockRejectedValueOnce(new Error("disk full"));
    const res = await POST(request(fileOfSize(1024)));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });
});
