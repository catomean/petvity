/**
 * Reserving stock without overselling, and without stranding it.
 *
 * The naive version reads stock, checks it, then writes — and loses the last
 * unit to whichever of two concurrent buyers writes second. The fix is to make
 * the check part of the write: a conditional update that only succeeds while
 * enough stock remains, so the database decides the winner rather than the
 * application.
 *
 * That creates the second problem this module exists for. An order with three
 * lines takes three separate conditional updates; if the third fails, the first
 * two have already been decremented and will stay decremented forever — stock
 * that exists but which nobody can buy. So a partial failure must compensate by
 * putting back exactly what it took.
 *
 * The algorithm is pure and the storage is injected, so it can be tested
 * against races and failures that are almost impossible to provoke against a
 * real database.
 */

export type ReservationRequest = {
  /** Whatever identifies the stock-keeping unit in the host system. */
  sku: string;
  quantity: number;
};

export type ReservationAdapter = {
  /**
   * Atomically decrement `sku` by `quantity`, but only if at least that much
   * remains. Returns true when the decrement happened.
   *
   * The whole correctness of this module rests on this being one statement.
   * In SQL: `UPDATE ... SET stock = stock - $q WHERE sku = $s AND stock >= $q`
   * and then checking the affected row count. A read followed by a write is
   * not good enough and will oversell under load.
   */
  decrementIfAvailable(sku: string, quantity: number): Promise<boolean>;

  /** Give stock back. Used to compensate a partial failure, and to cancel. */
  increment(sku: string, quantity: number): Promise<void>;
};

export type ReservationResult =
  | { ok: true; reserved: ReservationRequest[] }
  | {
      ok: false;
      /** The line that could not be satisfied. */
      failed: ReservationRequest;
      /** True when everything taken before the failure was successfully put
       *  back. False means stock is now stranded and needs an operator — the
       *  caller must not swallow this. */
      compensated: boolean;
      /** Lines that could not be restored, when `compensated` is false. */
      stranded: ReservationRequest[];
    };

export class ReservationError extends Error {
  override name = "ReservationError";
}

/**
 * Reserve every line, or none of them.
 *
 * Lines are reserved in a deterministic order — sorted by sku — because two
 * concurrent orders containing the same two products in opposite orders can
 * otherwise deadlock against each other in databases that take row locks.
 * Sorting means every caller takes the same locks in the same sequence.
 */
export async function reserveAll(
  adapter: ReservationAdapter,
  requests: ReservationRequest[],
): Promise<ReservationResult> {
  for (const r of requests) {
    if (!Number.isInteger(r.quantity) || r.quantity < 1) {
      throw new ReservationError(
        `Quantity for ${r.sku} must be a positive whole number, got ${r.quantity}`,
      );
    }
  }

  // Merge duplicate skus first: two lines of the same product must take one
  // combined decrement, or the availability check is wrong for the second.
  const merged = new Map<string, number>();
  for (const r of requests) {
    merged.set(r.sku, (merged.get(r.sku) ?? 0) + r.quantity);
  }
  const ordered: ReservationRequest[] = [...merged.entries()]
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => (a.sku < b.sku ? -1 : a.sku > b.sku ? 1 : 0));

  const taken: ReservationRequest[] = [];

  for (const request of ordered) {
    let succeeded = false;
    try {
      succeeded = await adapter.decrementIfAvailable(request.sku, request.quantity);
    } catch (cause) {
      // An adapter that threw may or may not have applied the decrement, so
      // treat it as failed and compensate only what we know we took.
      const { compensated } = await compensate(adapter, taken);
      throw new ReservationError(
        `Reserving ${request.sku} failed${compensated ? "" : " AND stock could not be restored"}: ${String(cause)}`,
      );
    }

    if (!succeeded) {
      const { compensated, stranded } = await compensate(adapter, taken);
      return { ok: false, failed: request, compensated, stranded };
    }
    taken.push(request);
  }

  return { ok: true, reserved: taken };
}

/** Put back everything in `taken`, reporting anything that could not be
 *  restored rather than throwing — the caller is already handling a failure. */
async function compensate(
  adapter: ReservationAdapter,
  taken: ReservationRequest[],
): Promise<{ compensated: boolean; stranded: ReservationRequest[] }> {
  const stranded: ReservationRequest[] = [];
  for (const t of taken) {
    try {
      await adapter.increment(t.sku, t.quantity);
    } catch {
      stranded.push(t);
    }
  }
  return { compensated: stranded.length === 0, stranded };
}

/**
 * Give back stock an order had reserved — a cancellation.
 *
 * Idempotence is the caller's job and it matters: calling this twice for one
 * cancellation invents stock out of nothing. Guard it on a state transition
 * (pending → cancelled) rather than on the cancel button.
 */
export async function releaseAll(
  adapter: ReservationAdapter,
  requests: ReservationRequest[],
): Promise<{ released: ReservationRequest[]; failed: ReservationRequest[] }> {
  const released: ReservationRequest[] = [];
  const failed: ReservationRequest[] = [];
  for (const r of requests) {
    try {
      await adapter.increment(r.sku, r.quantity);
      released.push(r);
    } catch {
      failed.push(r);
    }
  }
  return { released, failed };
}

/**
 * An in-memory adapter for tests and for shops with no persistence yet.
 *
 * `null` stock means unlimited, which is the right default for a digital good
 * or a made-to-order item and avoids modelling infinity as a large number.
 */
export function memoryInventory(initial: Record<string, number | null> = {}) {
  const stock = new Map<string, number | null>(Object.entries(initial));

  const adapter: ReservationAdapter = {
    async decrementIfAvailable(sku, quantity) {
      if (!stock.has(sku)) return false;
      const current = stock.get(sku)!;
      if (current === null) return true; // unlimited
      if (current < quantity) return false;
      stock.set(sku, current - quantity);
      return true;
    },
    async increment(sku, quantity) {
      const current = stock.get(sku);
      if (current === null || current === undefined) return;
      stock.set(sku, current + quantity);
    },
  };

  return {
    adapter,
    get: (sku: string) => stock.get(sku) ?? null,
    set: (sku: string, value: number | null) => stock.set(sku, value),
    snapshot: () => Object.fromEntries(stock),
  };
}
