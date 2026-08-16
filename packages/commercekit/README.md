# commercekit

**The correctness layer under a shop.** Not a commerce framework — it knows
nothing about your products, your database, your framework or your payment
provider. It owns the four things every shop rewrites and gets subtly wrong.

Zero runtime dependencies. Framework-free core. React bindings are a separate
entry point, so a Svelte or plain-JS consumer never imports React.

```bash
npm install commercekit
```

---

## Why this exists

Building a shop is mostly not hard. There are four places it *is* hard, and
they are the same four places every time:

| | The bug you ship without it |
|---|---|
| **Money** | `12.55 * 100` is `1254.9999999999998`. You lose a rappen, and later a threshold comparison that looked obviously true fails. |
| **Cart** | You cache the price in localStorage. A week later the shopper sees one price and is charged another — and the one they saw is the one they will argue about. |
| **Inventory** | You `SELECT stock` then `UPDATE stock`. Under load, two buyers get the same last unit. |
| **Guest identity** | You model the buyer as a nullable user id *and* a nullable email, permitting an order that belongs to nobody. Money taken, no one to ship to, unrepairable. |

---

## Money

Amounts are integers in minor units. No operation in this module can produce a
fraction.

```ts
import { money, fromDecimal, times, add, percent, allocate, format } from "commercekit";

const price = money(1250, "CHF");        // 12.50 CHF, stored as 1250
fromDecimal("12.55", "CHF").amount;      // 1255 — not 1254.99…
times(price, 3);                          // exact, always
format(price, "de-CH");                   // "CHF 12.50"
format(money(1250, "JPY"), "ja-JP");      // "¥1,250" — exponent comes from the currency
```

The currency carries its own exponent, so JPY has no decimals and KWD has three
without a special case at the call site.

### `allocate` — the one everybody gets wrong

Splitting 100 three ways gives 33.33 each. Round each down and you lose a unit;
round each up and you invent two.

```ts
allocate(money(100, "CHF"), [1, 1, 1]).map(m => m.amount);  // [34, 33, 33] — sums to 100
allocate(money(1000, "CHF"), [3, 7]).map(m => m.amount);    // [300, 700]
```

Largest-remainder distribution, ties to the earlier share, so it is
deterministic — the same split is recomputed identically on a refund. The test
suite asserts conservation across 200 amounts × 5 weight patterns.

`percent()` takes an explicit rounding mode, because the right answer depends on
who is paying: `half-up` matches invoice convention, but a marketplace computing
its own commission should round `down` rather than over-charge a seller.

---

## Cart

```ts
import { createCart, localStorageAdapter } from "commercekit";
import { useCartLines, useCartCount } from "commercekit/react";

export const cart = createCart({ storage: localStorageAdapter() });

cart.add("sku-1", 2);
cart.add("shoe", 1, "42");   // variants are separate lines
cart.count();                 // total units
```

**A line stores an id and a quantity. Never a price.** That is the whole design.
Prices are re-read from the server at checkout, so a cart left open for a week
cannot show one number and charge another.

Also handled: cross-tab sync, quantity clamping, line limits, and storage that
has been corrupted or hand-edited — a bad payload yields an empty cart rather
than a crashed shop. The snapshot reference is stable between changes, which is
what `useSyncExternalStore` requires to avoid an infinite render loop.

Storage is injected (`memoryStorage()` for SSR and tests), so nothing here stubs
globals.

---

## Inventory

```ts
import { reserveAll, releaseAll } from "commercekit";

const result = await reserveAll(adapter, [
  { sku: "a", quantity: 2 },
  { sku: "b", quantity: 1 },
]);

if (!result.ok) {
  // result.failed      — the line that could not be satisfied
  // result.compensated — was everything taken before it put back?
  // result.stranded    — if not, exactly what is now unbuyable
}
```

You implement one method, and it must be **one statement**:

```sql
UPDATE stock SET quantity = quantity - $2
WHERE sku = $1 AND quantity >= $2
```

Then check the affected row count. A read followed by a write oversells, and the
test suite contains a demonstration of exactly that — 50 buyers told "yes"
against 10 units, with the recorded stock falling by one.

All-or-nothing is the other half. A three-line order whose third line fails must
put the first two back, or that stock exists and nobody can ever buy it.
`compensated: false` means a human needs to know; the result type makes that
impossible to ignore silently.

Reservations are taken in sorted sku order, so two carts holding the same two
products in opposite order cannot deadlock against row locks.

---

## Buyer

```ts
import { buyerFromRow, buyerToRow, createReceiptToken, BUYER_IDENTITY_CHECK } from "commercekit";

buyerFromRow({ userId: "u1", guestEmail: null });   // { kind: "account", userId: "u1" }
buyerFromRow({ userId: null, guestEmail: "a@b.c" }); // { kind: "guest", email: "a@b.c" }
buyerFromRow({ userId: null, guestEmail: null });    // throws — nobody to ship to
```

A discriminated union, not two nullable fields. And because a type is a claim
rather than an enforcement, the matching constraint ships with it:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_buyer_identity
  CHECK ((user_id IS NOT NULL) <> (guest_email IS NOT NULL));
```

`createReceiptToken()` uses the platform CSPRNG and refuses to run without one —
the token is the only thing between a stranger and someone's delivery address.

---

## Addresses

ISO 3166-1 alpha-2 codes, with names from `Intl.DisplayNames`:

```ts
countryName("CH", "de");   // "Schweiz"
countryName("CH", "ar");   // "سويسرا"
countryOptions("ja");      // sorted for a Japanese reader
isCountryCode("XX");       // false — and so is "ZZ", which CLDR *does* name
```

Every locale the runtime supports, with no translation files to maintain and no
way for the German list to drift from the English one.

---

## What this is not

- Not a product catalogue, an order state machine, or a payment integration.
  Those are your domain and they differ per shop.
- Not an admin UI.
- Not a replacement for Stripe, Medusa or Saleor. It is the layer you still have
  to write correctly underneath whatever you choose.

## License

MIT
