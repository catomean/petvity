/**
 * Factory for a chainable, thenable Drizzle ORM mock.
 *
 * Drizzle builders are awaitable at any point in the chain (with or without .limit()).
 * This mock makes each chain object a real thenable so both patterns work:
 *   await db.select().from(t).where(c)          // no .limit()
 *   await db.select().from(t).where(c).limit(1) // with .limit()
 *
 * Usage:
 *   const db = makeMockDb();
 *   db._queueSelectResult([row1]);  // first select resolves to [row1]
 *   db._queueSelectResult([]);      // second select resolves to []
 *   db._insertReturning.mockResolvedValueOnce([newRow]);
 *   db._updateReturning.mockResolvedValueOnce([updatedRow]);
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
    // All further chain methods return the same thenable chain
    for (const m of ["from", "innerJoin", "leftJoin", "where", "orderBy", "groupBy", "offset", "limit"]) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    return chain;
  }

  const _insertReturning = vi.fn().mockResolvedValue([]);
  const _updateReturning = vi.fn().mockResolvedValue([]);
  const _deleteWhere = vi.fn().mockResolvedValue([]);

  const db = {
    // SELECT — each call creates a fresh thenable resolved from the queue
    select: vi.fn().mockImplementation(makeSelectChain),

    // INSERT — db.insert(table).values({...}).returning()
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: _insertReturning,
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

    // DELETE — db.delete(table).where(...)
    delete: vi.fn().mockReturnValue({ where: _deleteWhere }),

    // ── Helpers exposed to tests ──────────────────────────────────────────
    _queueSelectResult: (result: unknown[]) => selectQueue.push(result),
    _insertReturning,
    _updateReturning,
    _deleteWhere,
  };

  return db;
}

export type MockDb = ReturnType<typeof makeMockDb>;
