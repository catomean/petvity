/**
 * Money as integer minor units.
 *
 * The rule this module exists to enforce: money is never a float. `0.1 + 0.2`
 * is `0.30000000000000004`, and a shop that stores prices as decimals will
 * eventually charge a customer a unit it cannot account for, or fail a
 * threshold comparison that looked obviously true. So an amount is an integer
 * count of the currency's smallest unit — 1250 rappen, not 12.50 francs — and
 * the currency carries the exponent needed to render it.
 *
 * Everything here is pure and total. No operation can produce a fractional
 * amount, and every operation that could lose a unit accounts for where it went.
 */

export type CurrencyCode = string;

export type Currency = {
  code: CurrencyCode;
  /** Digits after the decimal point. 2 for CHF, 0 for JPY, 3 for KWD. */
  exponent: number;
};

/**
 * Currencies whose exponent is not 2, plus the common ones stated explicitly so
 * a typo is an unknown currency rather than a silently wrong exponent.
 * Anything absent assumes 2 — right for most circulating currencies, and
 * checkable via `isKnownCurrency` where certainty matters.
 */
const EXPONENTS: Record<string, number> = {
  // Zero-decimal
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  // Three-decimal
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  // Two-decimal, listed so they are known rather than defaulted
  AUD: 2, BRL: 2, CAD: 2, CHF: 2, CNY: 2, CZK: 2, DKK: 2, EUR: 2,
  GBP: 2, HKD: 2, ILS: 2, INR: 2, MXN: 2, NOK: 2, NZD: 2, PLN: 2,
  SEK: 2, SGD: 2, TRY: 2, USD: 2, ZAR: 2,
};

const DEFAULT_EXPONENT = 2;

export class MoneyError extends Error {
  override name = "MoneyError";
}

export function currency(code: CurrencyCode): Currency {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) {
    throw new MoneyError(`Not an ISO 4217 currency code: ${code}`);
  }
  return { code: upper, exponent: EXPONENTS[upper] ?? DEFAULT_EXPONENT };
}

export function isKnownCurrency(code: CurrencyCode): boolean {
  return Object.prototype.hasOwnProperty.call(EXPONENTS, code.toUpperCase());
}

/**
 * An amount of money. `amount` is an integer in minor units.
 *
 * A plain object rather than a class on purpose: it survives JSON, crosses a
 * server/client boundary and sits in a database row without a serializer. The
 * invariant is enforced at construction instead of by encapsulation.
 */
export type Money = {
  readonly amount: number;
  readonly currency: CurrencyCode;
};

export function money(amount: number, code: CurrencyCode): Money {
  if (!Number.isInteger(amount)) {
    throw new MoneyError(
      `Money must be whole minor units, got ${amount}. Use fromDecimal() for values like 12.50.`,
    );
  }
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError(`Amount ${amount} is outside the safe integer range`);
  }
  return { amount, currency: currency(code).code };
}

export function zero(code: CurrencyCode): Money {
  return money(0, code);
}

/**
 * Convert a major-unit decimal (12.50) to minor units (1250).
 *
 * Done on the digits rather than by multiplying the float: `12.55 * 100` is
 * `1254.9999999999998`, and truncating that loses a unit on an ordinary price.
 * Rounds half-up, the convention retail invoices use.
 */
export function fromDecimal(value: number | string, code: CurrencyCode): Money {
  const c = currency(code);
  const text = typeof value === "number" ? value.toFixed(c.exponent + 1) : value.trim();

  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    throw new MoneyError(`Cannot read "${value}" as a decimal amount`);
  }

  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const padded = fraction.padEnd(c.exponent + 1, "0");
  const kept = padded.slice(0, c.exponent);
  const nextDigit = Number(padded[c.exponent] ?? "0");

  let minor = Number(whole) * 10 ** c.exponent + Number(kept || "0");
  if (nextDigit >= 5) minor += 1;
  return money(negative ? -minor : minor, c.code);
}

/** Major-unit number, for APIs that insist on one. Lossy by definition — never
 *  feed the result back into arithmetic. */
export function toDecimal(m: Money): number {
  return m.amount / 10 ** currency(m.currency).exponent;
}

/* ─── Arithmetic ──────────────────────────────────────────────────────────── */

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Cannot combine ${a.currency} with ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function sum(amounts: Money[], code?: CurrencyCode): Money {
  if (amounts.length === 0) {
    if (!code) throw new MoneyError("Cannot sum an empty list without a currency");
    return zero(code);
  }
  return amounts.reduce(add);
}

export function negate(m: Money): Money {
  return money(-m.amount, m.currency);
}

/** Multiply by a whole quantity — the line-total case. Exact by construction. */
export function times(m: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) {
    throw new MoneyError(
      `Quantity must be whole, got ${quantity}. For a rate use percent(), for a share use allocate().`,
    );
  }
  return money(m.amount * quantity, m.currency);
}

export type Rounding = "half-up" | "half-even" | "down" | "up";

function roundTo(value: number, mode: Rounding): number {
  switch (mode) {
    case "down":
      return Math.trunc(value);
    case "up":
      return value < 0 ? Math.floor(value) : Math.ceil(value);
    case "half-even": {
      const floor = Math.floor(value);
      const diff = value - floor;
      if (diff > 0.5) return floor + 1;
      if (diff < 0.5) return floor;
      return floor % 2 === 0 ? floor : floor + 1;
    }
    case "half-up":
    default:
      return Math.sign(value) * Math.round(Math.abs(value));
  }
}

/**
 * A rate applied to an amount — VAT, commission, a discount.
 *
 * Rounding is a parameter because the right answer depends on who is paying:
 * half-up matches invoice convention, but a marketplace computing its own
 * commission should usually round "down" rather than over-charge a seller by
 * a unit.
 */
export function percent(m: Money, rate: number, rounding: Rounding = "half-up"): Money {
  if (!Number.isFinite(rate)) throw new MoneyError(`Rate must be finite, got ${rate}`);
  return money(roundTo(m.amount * rate, rounding), m.currency);
}

/**
 * Split an amount into shares without losing or inventing a single unit.
 *
 * The operation everyone writes by hand and gets subtly wrong. Dividing 100
 * three ways gives 33.33 each; rounding each down loses a unit, rounding each
 * up invents two. Largest-remainder distributes the leftover one unit at a time
 * to the shares with the biggest fractional part, so the parts always sum
 * exactly back to the whole.
 *
 * Ties go to the earlier share, so the same inputs always give the same split —
 * which matters when it is recomputed for a refund.
 */
export function allocate(m: Money, weights: number[]): Money[] {
  if (weights.length === 0) throw new MoneyError("Cannot allocate across zero shares");
  if (weights.some((w) => w < 0 || !Number.isFinite(w))) {
    throw new MoneyError("Allocation weights must be finite and non-negative");
  }

  const total = weights.reduce((s, w) => s + w, 0);
  if (total === 0) throw new MoneyError("Allocation weights must not all be zero");

  const exact = weights.map((w) => (m.amount * w) / total);
  const floors = exact.map((v) => Math.floor(v));
  let remainder = m.amount - floors.reduce((s, v) => s + v, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const result = [...floors];
  for (const { i } of order) {
    if (remainder === 0) break;
    const step = remainder > 0 ? 1 : -1;
    result[i] += step;
    remainder -= step;
  }

  return result.map((amount) => money(amount, m.currency));
}

/** Split evenly across n shares, remainder to the earliest shares. */
export function split(m: Money, shares: number): Money[] {
  if (!Number.isInteger(shares) || shares < 1) {
    throw new MoneyError(`Shares must be a positive whole number, got ${shares}`);
  }
  return allocate(m, new Array(shares).fill(1));
}

/* ─── Comparison ──────────────────────────────────────────────────────────── */

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0;
}

export const equals = (a: Money, b: Money): boolean => compare(a, b) === 0;
export const greaterThan = (a: Money, b: Money): boolean => compare(a, b) === 1;
export const lessThan = (a: Money, b: Money): boolean => compare(a, b) === -1;
export const isZero = (m: Money): boolean => m.amount === 0;
export const isNegative = (m: Money): boolean => m.amount < 0;
export const isPositive = (m: Money): boolean => m.amount > 0;

/* ─── Display ─────────────────────────────────────────────────────────────── */

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Render for a human, in their locale. Symbol placement, grouping and decimal
 * count all come from Intl, so there is no table to maintain and ¥1,250 renders
 * without decimals because the exponent came from the currency.
 */
export function format(
  m: Money,
  locale = "en",
  options: Intl.NumberFormatOptions = {},
): string {
  const key = `${locale}|${m.currency}|${JSON.stringify(options)}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: "currency", currency: m.currency, ...options });
    formatters.set(key, fmt);
  }
  return fmt.format(toDecimal(m));
}

/** Machine-readable form for logs and JSON a human may read. */
export function toText(m: Money): string {
  const c = currency(m.currency);
  const negative = m.amount < 0;
  const abs = Math.abs(m.amount).toString().padStart(c.exponent + 1, "0");
  const whole = abs.slice(0, abs.length - c.exponent) || "0";
  const fraction = c.exponent > 0 ? `.${abs.slice(abs.length - c.exponent)}` : "";
  return `${negative ? "-" : ""}${whole}${fraction} ${c.code}`;
}
