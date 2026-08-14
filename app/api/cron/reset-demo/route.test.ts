import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
vi.mock("@/lib/api/signal-cache", () => ({ refreshSignalCache: vi.fn() }));

import { POST } from "./route";
import { getInstance } from "@/lib/db";
import { users, pets } from "@/lib/db/schema";
import { DEMO_ACCOUNT } from "@/lib/config/demo";

/** Records every insert so a test can assert what the reset writes. */
function mockDb() {
  const inserts: Array<{ table: unknown; values: unknown }> = [];
  const db = {
    delete: () => ({ where: () => Promise.resolve() }),
    insert: (table: unknown) => ({
      values: (values: unknown) => {
        inserts.push({ table, values });
        // The route awaits some inserts directly and calls .returning() on
        // others, so the same object has to satisfy both.
        return Object.assign(Promise.resolve(), {
          returning: () => Promise.resolve([{ id: "row-id" }]),
        });
      },
    }),
    query: { pets: { findFirst: () => Promise.resolve(undefined) } },
  };
  vi.mocked(getInstance).mockReturnValue(db as never);
  return inserts;
}

function req(secret = "test-secret") {
  return { headers: new Headers({ authorization: `Bearer ${secret}` }) } as never;
}

describe("POST /api/cron/reset-demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("rejects a request without the cron secret", async () => {
    mockDb();
    const res = await POST({ headers: new Headers() } as never);
    expect(res.status).toBe(401);
  });

  it("reseeds the demo user under a pinned id, not a generated one", async () => {
    // The reset deletes the user row to cascade the wipe. If the insert let the
    // id be generated, every run minted a new identity while already-issued
    // sessions (30 days) still carried the old one — so a returning visitor was
    // signed in as a user that no longer existed and the demo read as empty.
    const inserts = mockDb();
    const res = await POST(req());
    expect(res.status).toBe(200);

    const userInsert = inserts.find((i) => i.table === users);
    expect(userInsert).toBeDefined();
    expect(userInsert!.values).toMatchObject({
      id: DEMO_ACCOUNT.id,
      email: DEMO_ACCOUNT.email,
    });
  });

  it("seeds a pet owned by the demo user", async () => {
    const inserts = mockDb();
    await POST(req());
    const petInsert = inserts.find((i) => i.table === pets);
    expect(petInsert).toBeDefined();
    expect(petInsert!.values).toMatchObject({ name: "Luna", species: "dog" });
  });
});
