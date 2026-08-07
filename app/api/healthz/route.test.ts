import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

import { GET } from "./route";
import { getInstance } from "@/lib/db";

describe("GET /api/healthz", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with db:true when the database answers", async () => {
    vi.mocked(getInstance).mockReturnValue({
      execute: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, db: true });
  });

  it("returns 503 when the database is unreachable", async () => {
    vi.mocked(getInstance).mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("down")),
    } as never);
    const res = await GET();
    expect(res.status).toBe(503);
  });
});
