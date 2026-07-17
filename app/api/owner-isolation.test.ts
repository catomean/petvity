/**
 * Cross-owner data isolation — regression net.
 *
 * The per-route tests mock DB *results*, so they stay green even if the
 * `eq(pets.ownerId, session.user.id)` scoping is deleted from a WHERE/ON
 * clause (the mock returns whatever is queued regardless of the condition).
 * This file closes that gap: it captures the actual Drizzle condition each
 * route hands to the DB, renders it to SQL via PgDialect, and asserts that
 * the query is scoped by `owner_id` bound to the *session* user id.
 *
 * If anyone removes the ownership scoping from these routes, these tests FAIL.
 *
 * Scenario throughout: user B (attacker) holds a valid session and requests
 * user A's (victim's) pet / health rows by id. Correct behavior: 404, no
 * write executed, and every lookup scoped by the attacker's own ownerId.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { makeMockDb, type MockDb } from "@/lib/test-helpers/db-mock";

/* ─── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ getInstance: vi.fn() }));

/* ─── Imports after mocks ──────────────────────────────────────────────────── */

import { GET as getPet, PATCH as patchPet, DELETE as deletePet } from "@/app/api/pets/[petId]/route";
import { GET as getMetrics, POST as postMetrics } from "@/app/api/health/metrics/[petId]/route";
import { PATCH as patchRecord, DELETE as deleteRecord } from "@/app/api/health/records/[recordId]/route";
import { requireSession } from "@/lib/auth/guards";
import { getInstance } from "@/lib/db";

/* ─── Fixtures ─────────────────────────────────────────────────────────────── */

// Victim (user A) owns the pet/record; attacker (user B) holds the session.
const VICTIM_PET_ID = "00000000-0000-4000-8000-0000000000aa";
const VICTIM_RECORD_ID = "00000000-0000-4000-8000-0000000000bb";
const ATTACKER_ID = "attacker-user-b";

const ATTACKER_SESSION = {
  user: { id: ATTACKER_ID, role: "pet_owner", email: "b@example.com", name: "User B" },
  expires: "2099-01-01",
};

const PET_CONTEXT = { params: Promise.resolve({ petId: VICTIM_PET_ID }) };
const RECORD_CONTEXT = { params: Promise.resolve({ recordId: VICTIM_RECORD_ID }) };

function makeRequest(path: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
}

/* ─── SQL condition assertions ─────────────────────────────────────────────── */

const dialect = new PgDialect();

/**
 * The load-bearing check: render the captured Drizzle condition to SQL and
 * require it to reference the pets.owner_id column with the SESSION user's id
 * as a bound parameter. Removing `eq(pets.ownerId, session.user.id)` from a
 * route makes this fail.
 */
function expectOwnerScoped(condition: unknown) {
  expect(condition, "query must carry a WHERE/ON condition").toBeDefined();
  const { sql, params } = dialect.sqlToQuery(condition as SQL);
  expect(sql, "condition must scope by owner_id").toContain('"owner_id"');
  expect(params, "owner_id must be bound to the session user id").toContain(ATTACKER_ID);
}

/** Condition passed to db.query.pets.findFirst({ where }). */
function findFirstWhere(db: MockDb): unknown {
  return db._queryFindFirst.mock.calls[0]?.[0]?.where;
}

/** Condition passed to db.update(...).set(...).where(cond). */
function updateWhere(db: MockDb): unknown {
  return db.update.mock.results[0]?.value.set.mock.results[0]?.value.where.mock.calls[0]?.[0];
}

/** Condition passed to db.delete(...).where(cond). */
function deleteWhere(db: MockDb): unknown {
  return db.delete.mock.results[0]?.value.where.mock.calls[0]?.[0];
}

/** ON condition of db.select(...).from(...).innerJoin(pets, cond). */
function innerJoinOn(db: MockDb): unknown {
  return db.select.mock.results[0]?.value.innerJoin.mock.calls[0]?.[1];
}

/* ─── Setup ────────────────────────────────────────────────────────────────── */

let db: MockDb;

beforeEach(() => {
  vi.clearAllMocks();
  db = makeMockDb();
  vi.mocked(getInstance).mockReturnValue(db as never);
  vi.mocked(requireSession).mockResolvedValue({ session: ATTACKER_SESSION as never, error: null });
  // Mock defaults model the correctly-scoped DB answer for a foreign row:
  // findFirst → undefined, update/delete returning → [] (zero rows matched).
});

/* ─── /api/pets/[petId] ────────────────────────────────────────────────────── */

describe("cross-owner isolation: /api/pets/[petId]", () => {
  it("GET returns 404 for another owner's pet", async () => {
    const res = await getPet(makeRequest(`/api/pets/${VICTIM_PET_ID}`, "GET"), PET_CONTEXT);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeUndefined();
  });

  it("GET lookup is scoped by pets.owner_id bound to the session user", async () => {
    await getPet(makeRequest(`/api/pets/${VICTIM_PET_ID}`, "GET"), PET_CONTEXT);
    expectOwnerScoped(findFirstWhere(db));
  });

  it("PATCH returns 404 and updates nothing for another owner's pet", async () => {
    const res = await patchPet(
      makeRequest(`/api/pets/${VICTIM_PET_ID}`, "PATCH", { name: "Hijacked" }),
      PET_CONTEXT,
    );
    expect(res.status).toBe(404);
  });

  it("PATCH update is scoped by pets.owner_id bound to the session user", async () => {
    await patchPet(
      makeRequest(`/api/pets/${VICTIM_PET_ID}`, "PATCH", { name: "Hijacked" }),
      PET_CONTEXT,
    );
    expectOwnerScoped(updateWhere(db));
  });

  it("DELETE returns 404 for another owner's pet", async () => {
    const res = await deletePet(makeRequest(`/api/pets/${VICTIM_PET_ID}`, "DELETE"), PET_CONTEXT);
    expect(res.status).toBe(404);
  });

  it("DELETE is scoped by pets.owner_id bound to the session user", async () => {
    await deletePet(makeRequest(`/api/pets/${VICTIM_PET_ID}`, "DELETE"), PET_CONTEXT);
    expectOwnerScoped(deleteWhere(db));
  });
});

/* ─── /api/health/metrics/[petId] ──────────────────────────────────────────── */

describe("cross-owner isolation: /api/health/metrics/[petId]", () => {
  it("GET returns 404 and leaks no metrics for another owner's pet", async () => {
    const res = await getMetrics(
      makeRequest(`/api/health/metrics/${VICTIM_PET_ID}`, "GET"),
      PET_CONTEXT,
    );
    expect(res.status).toBe(404);
    // Route must bail before querying metrics — no findMany reached
    expect(db._queryFindMany).not.toHaveBeenCalled();
  });

  it("GET ownership check is scoped by pets.owner_id bound to the session user", async () => {
    await getMetrics(makeRequest(`/api/health/metrics/${VICTIM_PET_ID}`, "GET"), PET_CONTEXT);
    expectOwnerScoped(findFirstWhere(db));
  });

  it("POST returns 404 and writes nothing to another owner's pet", async () => {
    const res = await postMetrics(
      makeRequest(`/api/health/metrics/${VICTIM_PET_ID}`, "POST", {
        date: "2020-01-01",
        energy: 1,
      }),
      PET_CONTEXT,
    );
    expect(res.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("POST ownership check is scoped by pets.owner_id bound to the session user", async () => {
    await postMetrics(
      makeRequest(`/api/health/metrics/${VICTIM_PET_ID}`, "POST", {
        date: "2020-01-01",
        energy: 1,
      }),
      PET_CONTEXT,
    );
    expectOwnerScoped(findFirstWhere(db));
  });
});

/* ─── /api/health/records/[recordId] ───────────────────────────────────────── */

describe("cross-owner isolation: /api/health/records/[recordId]", () => {
  it("PATCH returns 404 and updates nothing for another owner's record", async () => {
    const res = await patchRecord(
      makeRequest(`/api/health/records/${VICTIM_RECORD_ID}`, "PATCH", { title: "Hijacked" }),
      RECORD_CONTEXT,
    );
    expect(res.status).toBe(404);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("PATCH ownership JOIN is scoped by pets.owner_id bound to the session user", async () => {
    await patchRecord(
      makeRequest(`/api/health/records/${VICTIM_RECORD_ID}`, "PATCH", { title: "Hijacked" }),
      RECORD_CONTEXT,
    );
    expectOwnerScoped(innerJoinOn(db));
  });

  it("DELETE returns 404 and deletes nothing for another owner's record", async () => {
    const res = await deleteRecord(
      makeRequest(`/api/health/records/${VICTIM_RECORD_ID}`, "DELETE"),
      RECORD_CONTEXT,
    );
    expect(res.status).toBe(404);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("DELETE ownership JOIN is scoped by pets.owner_id bound to the session user", async () => {
    await deleteRecord(makeRequest(`/api/health/records/${VICTIM_RECORD_ID}`, "DELETE"), RECORD_CONTEXT);
    expectOwnerScoped(innerJoinOn(db));
  });
});
