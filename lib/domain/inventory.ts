/**
 * Petvity's stock adapter for `commercekit`'s reservation algorithm.
 *
 * All this file owns is how a product's stock is read and written. The
 * all-or-nothing orchestration, the compensation on partial failure, the sorted
 * lock order and the merging of duplicate lines live in the package.
 */

import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { products } from "@/lib/db/schema";
import type { ReservationAdapter } from "@/packages/commercekit/src/inventory";
import type { getInstance } from "@/lib/db";

type Db = ReturnType<typeof getInstance>;

export function drizzleInventory(db: Db): ReservationAdapter {
  return {
    /**
     * One statement, which is the whole correctness argument: the availability
     * check is part of the write, so two buyers racing for the last unit are
     * resolved by Postgres rather than by whichever request read first.
     *
     * A null stock means unlimited. `stock - n` on NULL is NULL, so an
     * unlimited product stays unlimited while still reporting success — which
     * is why the null case needs no branch of its own.
     */
    async decrementIfAvailable(sku, quantity) {
      const rows = await db
        .update(products)
        .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
        .where(
          and(
            eq(products.id, sku),
            or(isNull(products.stock), gte(products.stock, quantity)),
          ),
        )
        .returning({ id: products.id });
      return rows.length > 0;
    },

    async increment(sku, quantity) {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${quantity}`, updatedAt: new Date() })
        .where(eq(products.id, sku));
    },
  };
}
