import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Prices must survive a currency whose minor unit is not 1/100.
 *
 * The old implementation divided by 100 unconditionally, so with
 * NEXT_PUBLIC_APP_CURRENCY=JPY a ¥2,999 product rendered as ¥30 — a hundredfold
 * error, silently, on every price in the shop. APP_CURRENCY is an environment
 * variable, so this was one deployment away from being real.
 */

async function formatWith(currency: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_APP_CURRENCY", currency);
  const mod = await import("./format");
  return mod;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("formatPrice respects the currency's exponent", () => {
  it("renders two-decimal currencies unchanged", async () => {
    const { formatPrice } = await formatWith("USD");
    expect(formatPrice(2999, "en")).toContain("29.99");
  });

  it("renders a zero-decimal currency at full value, not 1/100th", async () => {
    const { formatPrice } = await formatWith("JPY");
    const out = formatPrice(2999, "en");
    expect(out).toContain("2,999");
    expect(out).not.toContain("30");
  });

  it("handles the other zero-decimal currencies too", async () => {
    for (const code of ["KRW", "VND", "ISK"]) {
      const { formatPrice } = await formatWith(code);
      expect(formatPrice(2999, "en"), code).toMatch(/2[.,]999/);
    }
  });

  it("renders a three-decimal currency with three decimals", async () => {
    const { formatPrice } = await formatWith("KWD");
    expect(formatPrice(2999, "en")).toContain("2.999");
  });

  it("formats zero", async () => {
    const { formatPrice } = await formatWith("USD");
    expect(formatPrice(0, "en")).toContain("0.00");
  });
});

describe("formatAdoptionFee", () => {
  it("says Free for nothing", async () => {
    const { formatAdoptionFee } = await formatWith("USD");
    expect(formatAdoptionFee(null)).toBe("Free");
    expect(formatAdoptionFee(0)).toBe("Free");
  });

  it("drops minor units — a fee is a headline, not an invoice", async () => {
    const { formatAdoptionFee } = await formatWith("USD");
    const out = formatAdoptionFee(2500, "en");
    expect(out).toContain("25");
    expect(out).not.toContain(".00");
  });

  it("does not divide a zero-decimal currency by 100 either", async () => {
    const { formatAdoptionFee } = await formatWith("JPY");
    expect(formatAdoptionFee(2500, "en")).toContain("2,500");
  });
});
