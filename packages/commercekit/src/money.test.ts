import { describe, it, expect } from "vitest";
import {
  money,
  zero,
  fromDecimal,
  toDecimal,
  currency,
  isKnownCurrency,
  add,
  subtract,
  sum,
  negate,
  times,
  percent,
  allocate,
  split,
  compare,
  equals,
  greaterThan,
  lessThan,
  isZero,
  isNegative,
  isPositive,
  format,
  toText,
  MoneyError,
} from "./money";

describe("construction", () => {
  it("takes whole minor units", () => {
    expect(money(1250, "CHF")).toEqual({ amount: 1250, currency: "CHF" });
  });

  it("refuses a fractional amount rather than silently rounding", () => {
    // The whole point of the module: a float must never become an amount by
    // accident.
    expect(() => money(12.5, "CHF")).toThrow(MoneyError);
  });

  it("refuses an amount beyond exact integer arithmetic", () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 2, "CHF")).toThrow(MoneyError);
  });

  it("normalises the currency code", () => {
    expect(money(1, "chf").currency).toBe("CHF");
  });

  it("rejects something that is not a currency code", () => {
    expect(() => money(1, "franc")).toThrow(MoneyError);
    expect(() => money(1, "CH")).toThrow(MoneyError);
  });
});

describe("currency exponents", () => {
  it("knows the zero-decimal currencies", () => {
    expect(currency("JPY").exponent).toBe(0);
    expect(currency("KRW").exponent).toBe(0);
  });

  it("knows the three-decimal currencies", () => {
    expect(currency("KWD").exponent).toBe(3);
    expect(currency("BHD").exponent).toBe(3);
  });

  it("assumes two decimals for anything unlisted, and admits it", () => {
    expect(currency("XYZ").exponent).toBe(2);
    expect(isKnownCurrency("XYZ")).toBe(false);
    expect(isKnownCurrency("CHF")).toBe(true);
  });
});

describe("fromDecimal", () => {
  it("converts the obvious cases", () => {
    expect(fromDecimal(12.5, "CHF").amount).toBe(1250);
    expect(fromDecimal("12.50", "CHF").amount).toBe(1250);
    expect(fromDecimal(0, "CHF").amount).toBe(0);
  });

  it("survives the floats that break naive multiplication", () => {
    // 12.55 * 100 is 1254.9999999999998 in IEEE 754. Truncating loses a rappen.
    expect(fromDecimal(12.55, "CHF").amount).toBe(1255);
    expect(fromDecimal(1.005, "CHF").amount).toBe(101);
    expect(fromDecimal(0.29, "CHF").amount).toBe(29);
    expect(fromDecimal(1.1 + 2.2, "CHF").amount).toBe(330);
  });

  it("respects the currency's exponent", () => {
    expect(fromDecimal(1250, "JPY").amount).toBe(1250);
    expect(fromDecimal("12.345", "KWD").amount).toBe(12345);
  });

  it("rounds half-up, the way an invoice does", () => {
    expect(fromDecimal("0.005", "CHF").amount).toBe(1);
    expect(fromDecimal("0.004", "CHF").amount).toBe(0);
  });

  it("handles negatives", () => {
    expect(fromDecimal("-12.50", "CHF").amount).toBe(-1250);
  });

  it("rejects text that is not a number", () => {
    expect(() => fromDecimal("twelve", "CHF")).toThrow(MoneyError);
    expect(() => fromDecimal("12,50", "CHF")).toThrow(MoneyError);
  });

  it("round-trips through toDecimal", () => {
    for (const v of ["0.01", "12.50", "999.99", "-3.33"]) {
      expect(toDecimal(fromDecimal(v, "CHF")).toFixed(2)).toBe(Number(v).toFixed(2));
    }
  });
});

describe("arithmetic", () => {
  const chf = (n: number) => money(n, "CHF");

  it("adds and subtracts", () => {
    expect(add(chf(1000), chf(250)).amount).toBe(1250);
    expect(subtract(chf(1000), chf(250)).amount).toBe(750);
  });

  it("refuses to mix currencies", () => {
    // Silently adding EUR to CHF is how a total becomes fiction.
    expect(() => add(chf(100), money(100, "EUR"))).toThrow(MoneyError);
    expect(() => compare(chf(100), money(100, "EUR"))).toThrow(MoneyError);
  });

  it("sums a list, and an empty one given a currency", () => {
    expect(sum([chf(100), chf(200), chf(300)]).amount).toBe(600);
    expect(sum([], "CHF")).toEqual(zero("CHF"));
    expect(() => sum([])).toThrow(MoneyError);
  });

  it("negates", () => {
    expect(negate(chf(500)).amount).toBe(-500);
  });

  it("multiplies by a whole quantity", () => {
    expect(times(chf(1250), 3).amount).toBe(3750);
    expect(times(chf(1250), 0).amount).toBe(0);
  });

  it("refuses a fractional quantity, pointing at the right tool", () => {
    expect(() => times(chf(1000), 0.5)).toThrow(/percent|allocate/);
  });
});

describe("percent", () => {
  const chf = (n: number) => money(n, "CHF");

  it("applies a rate", () => {
    expect(percent(chf(10000), 0.077).amount).toBe(770);
  });

  it("rounds the way the caller asked", () => {
    expect(percent(chf(1000), 0.155, "half-up").amount).toBe(155);
    expect(percent(chf(101), 0.5, "half-up").amount).toBe(51);
    expect(percent(chf(101), 0.5, "down").amount).toBe(50);
    expect(percent(chf(101), 0.5, "up").amount).toBe(51);
  });

  it("rounds half-even when asked, for statistical neutrality", () => {
    // Only meaningful when the result lands exactly on .5 — it then goes to the
    // nearest EVEN unit, so repeated rounding does not drift upward the way
    // half-up does.
    expect(percent(chf(51), 0.5, "half-even").amount).toBe(26); // 25.5 -> 26
    expect(percent(chf(49), 0.5, "half-even").amount).toBe(24); // 24.5 -> 24
    // Half-up takes both of those upward instead.
    expect(percent(chf(49), 0.5, "half-up").amount).toBe(25);
  });

  it("handles negative amounts symmetrically", () => {
    expect(percent(chf(-101), 0.5, "half-up").amount).toBe(-51);
    expect(percent(chf(-101), 0.5, "down").amount).toBe(-50);
  });
});

describe("allocate — never loses or invents a unit", () => {
  const chf = (n: number) => money(n, "CHF");

  it("splits an indivisible amount without losing anything", () => {
    const parts = allocate(chf(100), [1, 1, 1]);
    expect(parts.map((p) => p.amount)).toEqual([34, 33, 33]);
    expect(sum(parts).amount).toBe(100);
  });

  it("splits by weight", () => {
    const parts = allocate(chf(1000), [3, 7]);
    expect(parts.map((p) => p.amount)).toEqual([300, 700]);
  });

  it("gives leftovers to the largest remainder", () => {
    const parts = allocate(chf(1000), [1, 1, 1, 1, 1, 1, 1]);
    expect(sum(parts).amount).toBe(1000);
    // 1000/7 = 142.857..., so six shares of 143 and one of 142.
    expect(parts.filter((p) => p.amount === 143)).toHaveLength(6);
    expect(parts.filter((p) => p.amount === 142)).toHaveLength(1);
  });

  it("is deterministic, so a refund recomputes the same split", () => {
    const a = allocate(chf(100), [1, 1, 1]).map((p) => p.amount);
    const b = allocate(chf(100), [1, 1, 1]).map((p) => p.amount);
    expect(a).toEqual(b);
  });

  it("conserves the total for many awkward amounts", () => {
    for (let amount = 0; amount <= 200; amount++) {
      for (const weights of [[1, 1, 1], [1, 2, 3], [5, 5, 1], [1], [7, 11, 13, 17]]) {
        const parts = allocate(chf(amount), weights);
        expect(sum(parts).amount, `${amount} across ${weights}`).toBe(amount);
        expect(parts).toHaveLength(weights.length);
      }
    }
  });

  it("conserves negatives too, for refunds", () => {
    const parts = allocate(chf(-100), [1, 1, 1]);
    expect(sum(parts).amount).toBe(-100);
  });

  it("tolerates a zero weight", () => {
    const parts = allocate(chf(100), [1, 0, 1]);
    expect(parts[1].amount).toBe(0);
    expect(sum(parts).amount).toBe(100);
  });

  it("rejects nonsense weights", () => {
    expect(() => allocate(chf(100), [])).toThrow(MoneyError);
    expect(() => allocate(chf(100), [0, 0])).toThrow(MoneyError);
    expect(() => allocate(chf(100), [-1, 2])).toThrow(MoneyError);
    expect(() => allocate(chf(100), [NaN])).toThrow(MoneyError);
  });

  it("splits evenly via split()", () => {
    expect(split(chf(100), 3).map((p) => p.amount)).toEqual([34, 33, 33]);
    expect(() => split(chf(100), 0)).toThrow(MoneyError);
    expect(() => split(chf(100), 1.5)).toThrow(MoneyError);
  });
});

describe("comparison", () => {
  const chf = (n: number) => money(n, "CHF");

  it("orders amounts", () => {
    expect(compare(chf(100), chf(200))).toBe(-1);
    expect(compare(chf(200), chf(100))).toBe(1);
    expect(compare(chf(100), chf(100))).toBe(0);
  });

  it("exposes readable predicates", () => {
    expect(equals(chf(100), chf(100))).toBe(true);
    expect(greaterThan(chf(200), chf(100))).toBe(true);
    expect(lessThan(chf(100), chf(200))).toBe(true);
    expect(isZero(chf(0))).toBe(true);
    expect(isNegative(chf(-1))).toBe(true);
    expect(isPositive(chf(1))).toBe(true);
  });
});

describe("display", () => {
  it("formats in the reader's locale", () => {
    // Non-breaking spaces vary by ICU build, so assert on the parts.
    const de = format(money(1250, "CHF"), "de-CH");
    expect(de).toContain("12.50");
    expect(de).toContain("CHF");
  });

  it("drops decimals for a zero-decimal currency", () => {
    const ja = format(money(1250, "JPY"), "ja-JP");
    expect(ja).toContain("1,250");
    expect(ja).not.toContain(".00");
  });

  it("has a stable machine form", () => {
    expect(toText(money(1250, "CHF"))).toBe("12.50 CHF");
    expect(toText(money(1250, "JPY"))).toBe("1250 JPY");
    expect(toText(money(-5, "CHF"))).toBe("-0.05 CHF");
    expect(toText(money(0, "CHF"))).toBe("0.00 CHF");
    expect(toText(money(12345, "KWD"))).toBe("12.345 KWD");
  });
});
