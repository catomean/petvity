/**
 * Factory for a chainable, thenable Drizzle ORM mock.
 *
 * Drizzle builders are awaitable at any point. This mock makes each chain
 * object a real thenable so both patterns work:
 *   await db.select().from(t).where(c)          // no .limit()
 *   await db.select().from(t).where(c).limit(1) // with .limit()
 *   await db.delete(t).where(c)                 // no .returning()
 *   await db.delete(t).where(c).returning(cols) // with .returning()
 *
 * Builder API:
 *   db._queueSelectResult([row1])  → next select resolves to [row1]
 *   db._insertReturning.mockResolvedValueOnce([newRow])
 *   db._updateReturning.mockResolvedValueOnce([updatedRow])
 *   db._deleteReturning.mockResolvedValueOnce([{ id }])
 *
 * Relational query API (db.query.<table>.findFirst / findMany):
 *   db._queryFindFirst.mockResolvedValueOnce(row)   → next findFirst call
 *   db._queryFindMany.mockResolvedValueOnce([rows]) → next findMany call
 *   (all tables share the same queue-based mocks for simplicity)
 */
import { vi } from "vitest";

export function makeMockDb() {
  const selectQueue: unknown[][] = [];

  /** Each call to db.select() creates a fresh thenable chain. */
  function makeSelectChain() {
    const value = selectQueue.length > 0 ? selectQueue.shift()! : [];
    const p = Promise.resolve(value);
    const chain: any = {
      then:    p.then.bind(p),
      catch:   p.catch.bind(p),
      finally: p.finally.bind(p),
    };
    for (const m of ["from", "innerJoin", "leftJoin", "where", "orderBy", "groupBy", "offset", "limit"]) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    return chain;
  }

  const _insertReturning = vi.fn().mockResolvedValue([]);
  const _updateReturning = vi.fn().mockResolvedValue([]);
  const _deleteReturning = vi.fn().mockResolvedValue([]);

  // Relational query mocks — shared across all tables
  const _queryFindFirst = vi.fn().mockResolvedValue(undefined);
  const _queryFindMany  = vi.fn().mockResolvedValue([]);
  const queryTable = { findFirst: _queryFindFirst, findMany: _queryFindMany };

  /**
   * Delete where() returns a thenable chain (for direct await) that also
   * exposes .returning() — supports both Drizzle usage patterns.
   */
  function makeDeleteWhereChain() {
    // Direct await resolves to undefined (routes that don't use .returning())
    const p = Promise.resolve(undefined as unknown);
    return {
      then:      p.then.bind(p),
      catch:     p.catch.bind(p),
      finally:   p.finally.bind(p),
      returning: _deleteReturning,
    };
  }

  const db = {
    // SELECT — each call creates a fresh thenable resolved from the queue
    select: vi.fn().mockImplementation(makeSelectChain),

    // INSERT — supports all patterns:
    //   await db.insert(t).values({...})
    //   await db.insert(t).values({...}).returning()
    //   await db.insert(t).values({...}).onConflictDoUpdate({...}).returning()
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation(() => {
        // Make values() itself awaitable (for inserts without .returning())
        const p = Promise.resolve([] as unknown[]);
        return Object.assign(p, {
          returning: _insertReturning,
          onConflictDoUpdate: vi.fn().mockReturnValue({ returning: _insertReturning }),
        });
      }),
    }),

    // UPDATE — db.update(table).set({...}).where(...).returning()
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: _updateReturning,
        }),
      }),
    }),

    // DELETE — supports both:
    //   await db.delete(t).where(c)
    //   const [row] = await db.delete(t).where(c).returning(cols)
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockImplementation(makeDeleteWhereChain) }),

    // RELATIONAL QUERIES — db.query.<table>.findFirst / findMany
    // All tables share the same underlying mocks for simplicity.
    query: new Proxy({} as Record<string, typeof queryTable>, {
      get: () => queryTable,
    }),

    // ── Helpers exposed to tests ──────────────────────────────────────────
    _queueSelectResult: (result: unknown[]) => selectQueue.push(result),
    _insertReturning,
    _updateReturning,
    _deleteReturning,
    _queryFindFirst,
    _queryFindMany,
  };

  return db;
}

export type MockDb = ReturnType<typeof makeMockDb>;
