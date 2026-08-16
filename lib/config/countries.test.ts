import { describe, it, expect } from "vitest";
import { COUNTRY_CODES, countryName, countryOptions, isCountryCode } from "./countries";

describe("COUNTRY_CODES", () => {
  it("has no duplicates", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
  });

  it("is entirely two uppercase letters", () => {
    expect(COUNTRY_CODES.filter((c) => !/^[A-Z]{2}$/.test(c))).toEqual([]);
  });

  it("resolves every code to a real name", () => {
    // A code the runtime cannot name would render as its own two letters in a
    // dropdown — the shopper would see "XK" and not know what to pick.
    const unnamed = COUNTRY_CODES.filter((code) => countryName(code, "en") === code);
    expect(unnamed).toEqual([]);
  });
});

describe("countryName", () => {
  it("translates into the reader's language", () => {
    expect(countryName("CH", "en")).toBe("Switzerland");
    expect(countryName("CH", "de")).toBe("Schweiz");
  });

  it("accepts a lowercase code", () => {
    expect(countryName("ch", "en")).toBe("Switzerland");
  });

  it("falls back to the input when Intl cannot name it", () => {
    // A malformed region makes Intl.DisplayNames throw; the address block on a
    // receipt must still render rather than take the page down.
    expect(countryName("!!", "en")).toBe("!!");
    expect(countryName("LONGER", "en")).toBe("LONGER");
  });
});

describe("countryOptions", () => {
  it("returns every country, sorted for the reader", () => {
    const options = countryOptions("en");
    expect(options.length).toBe(COUNTRY_CODES.length);
    const names = options.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  });
});

describe("isCountryCode", () => {
  it("accepts a real country in any case", () => {
    expect(isCountryCode("CH")).toBe(true);
    expect(isCountryCode("ch")).toBe(true);
  });

  it("rejects a placeholder that is merely two letters", () => {
    expect(isCountryCode("XX")).toBe(false);
    expect(isCountryCode("")).toBe(false);
    // CLDR names "ZZ" as "Unknown Region", so a name lookup alone would let it
    // through — the allow-list is what actually keeps it out of an address.
    expect(isCountryCode("ZZ")).toBe(false);
  });
});
