import { describe, it, expect } from "vitest";
import { getEmailStrings, t, type EmailLocale } from "./i18n";

const SUPPORTED_LOCALES: EmailLocale[] = [
  "en", "de", "fr", "es", "ja", "zh", "ko", "tr", "ar",
];

describe("getEmailStrings", () => {
  it("returns English strings for unknown locale", () => {
    const s = getEmailStrings("klingon");
    const en = getEmailStrings("en");
    expect(s.ownerWelcome.button).toBe(en.ownerWelcome.button);
  });

  it("returns English strings for null/undefined locale", () => {
    const s1 = getEmailStrings(null);
    const s2 = getEmailStrings(undefined);
    const en = getEmailStrings("en");
    expect(s1.ownerWelcome.button).toBe(en.ownerWelcome.button);
    expect(s2.ownerWelcome.button).toBe(en.ownerWelcome.button);
  });

  it("returns locale-specific strings for every supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const s = getEmailStrings(locale);
      expect(s, `${locale}`).toBeDefined();
      expect(typeof s.ownerWelcome.subject, `${locale} subject`).toBe("string");
      expect(s.ownerWelcome.subject.length, `${locale} subject non-empty`).toBeGreaterThan(0);
    }
  });

  it("ar locale has dir=rtl; all others have dir=ltr", () => {
    expect(getEmailStrings("ar").dir).toBe("rtl");
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== "ar")) {
      expect(getEmailStrings(locale).dir, locale).toBe("ltr");
    }
  });

  it("every locale has translated (non-English) strings for non-English locales", () => {
    const en = getEmailStrings("en");
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== "en")) {
      const s = getEmailStrings(locale);
      // At minimum the welcome button text should differ from English
      expect(s.ownerWelcome.button, `${locale} welcome button`).not.toBe(
        en.ownerWelcome.button,
      );
    }
  });

  it("each locale has all required template namespaces", () => {
    const NAMESPACES = [
      "ownerWelcome", "ownerAddPet", "ownerHealthTracking", "ownerWeekOne",
      "passwordReset", "petHealthAlert", "vaccinationReminder",
      "medicationEndingReminder", "bookingReminder", "bookingRequestReceived",
      "bookingStatusChanged", "orderConfirmation", "orderStatusUpdate",
      "sellerOrderNotification", "adoptionApplicationReceived",
      "adoptionApplicationStatusChanged", "professionalVerification",
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      const s = getEmailStrings(locale) as Record<string, unknown>;
      for (const ns of NAMESPACES) {
        expect(s[ns], `${locale}.${ns}`).toBeDefined();
      }
    }
  });

  it("ownerWeekOne bullets is an array of 6 items in every locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const bullets = getEmailStrings(locale).ownerWeekOne.bullets;
      expect(Array.isArray(bullets), `${locale} bullets array`).toBe(true);
      expect(bullets.length, `${locale} bullet count`).toBe(6);
    }
  });

  it("bookingStatusChanged has confirmed/cancelled/completed sub-entries", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const bsc = getEmailStrings(locale).bookingStatusChanged;
      expect(typeof bsc.confirmed.subject, locale).toBe("string");
      expect(typeof bsc.cancelled.h2, locale).toBe("string");
      expect(typeof bsc.completed.body, locale).toBe("string");
    }
  });
});

describe("t (interpolation)", () => {
  it("replaces {{key}} placeholders with provided values", () => {
    expect(t("Hello, {{name}}!", { name: "Alice" })).toBe("Hello, Alice!");
  });

  it("leaves unknown placeholders intact", () => {
    expect(t("Hello, {{name}}!", {})).toBe("Hello, {{name}}!");
  });

  it("handles multiple replacements in one string", () => {
    expect(t("{{a}} and {{b}}", { a: "foo", b: "bar" })).toBe("foo and bar");
  });

  it("coerces numeric values to string", () => {
    expect(t("Count: {{n}}", { n: 3 })).toBe("Count: 3");
  });
});
