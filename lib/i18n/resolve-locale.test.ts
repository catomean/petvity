import { describe, it, expect } from "vitest";
import { resolvePreferredLocale } from "./resolve-locale";

describe("resolvePreferredLocale", () => {
  it("prefers a valid cookie over Accept-Language", () => {
    expect(resolvePreferredLocale({ cookieLocale: "ja", acceptLanguage: "de-DE,de;q=0.9" })).toBe(
      "ja",
    );
  });

  it("ignores an unknown cookie value and falls through", () => {
    expect(resolvePreferredLocale({ cookieLocale: "xx", acceptLanguage: "fr-FR" })).toBe("fr");
  });

  it("matches the primary subtag when only a regioned tag is sent (de-CH → de)", () => {
    expect(resolvePreferredLocale({ cookieLocale: null, acceptLanguage: "de-CH" })).toBe("de");
  });

  it("walks through weighted tags in order, picking the first supported one", () => {
    expect(
      resolvePreferredLocale({
        cookieLocale: null,
        // it (unsupported) → ja (supported) → de (supported) → ar — picks ja
        acceptLanguage: "it;q=1.0,ja;q=0.9,de;q=0.8,ar;q=0.7",
      }),
    ).toBe("ja");
  });

  it("supports right-to-left locales (ar)", () => {
    expect(resolvePreferredLocale({ cookieLocale: null, acceptLanguage: "ar-SA" })).toBe("ar");
  });

  it("falls back to defaultLocale when nothing matches", () => {
    expect(resolvePreferredLocale({ cookieLocale: null, acceptLanguage: "xx-YY,zz" })).toBe("en");
  });

  it("falls back to defaultLocale when both inputs are empty", () => {
    expect(resolvePreferredLocale({ cookieLocale: null, acceptLanguage: null })).toBe("en");
    expect(resolvePreferredLocale({ cookieLocale: "", acceptLanguage: "" })).toBe("en");
  });

  it("is case-insensitive on Accept-Language tags", () => {
    expect(resolvePreferredLocale({ cookieLocale: null, acceptLanguage: "DE-CH" })).toBe("de");
  });
});
