import { describe, it, expect } from "vitest";
import {
  orderCreateSchema,
  guestOrderCreateSchema,
  guestOrderPath,
  guestOrderUrl,
  toLocale,
} from "./orders";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";

const VALID = {
  shippingName: "Ada Lovelace",
  shippingLine1: "12 Analytical Way",
  shippingPostalCode: "8001",
  shippingCity: "Zürich",
  shippingCountry: "CH",
  items: [{ productId: "0b7b4d4c-24e0-4a0e-9e1a-1c3d5f7a9b1d", quantity: 2 }],
};

describe("orderCreateSchema", () => {
  it("accepts a complete order", () => {
    expect(orderCreateSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects an empty cart", () => {
    // Placing an order for nothing would reserve no stock but still email a
    // seller and open a payment session for 0.
    expect(orderCreateSchema.safeParse({ ...VALID, items: [] }).success).toBe(false);
  });

  it("rejects a country that is two letters but not a country", () => {
    expect(
      orderCreateSchema.safeParse({ ...VALID, shippingCountry: "XX" }).success,
    ).toBe(false);
  });

  it("rejects a quantity above the shared cap", () => {
    // The cart's + button and this schema must agree, or a shopper builds a
    // cart the server then refuses at the last step.
    expect(
      orderCreateSchema.safeParse({
        ...VALID,
        items: [{ ...VALID.items[0], quantity: MAX_ITEM_QUANTITY + 1 }],
      }).success,
    ).toBe(false);
    expect(
      orderCreateSchema.safeParse({
        ...VALID,
        items: [{ ...VALID.items[0], quantity: MAX_ITEM_QUANTITY }],
      }).success,
    ).toBe(true);
  });

  it("rejects a zero or fractional quantity", () => {
    for (const quantity of [0, -1, 1.5]) {
      expect(
        orderCreateSchema.safeParse({ ...VALID, items: [{ ...VALID.items[0], quantity }] })
          .success,
      ).toBe(false);
    }
  });

  it("requires a delivery address", () => {
    for (const field of [
      "shippingName",
      "shippingLine1",
      "shippingPostalCode",
      "shippingCity",
    ] as const) {
      expect(orderCreateSchema.safeParse({ ...VALID, [field]: "" }).success).toBe(false);
    }
  });

  it("does not accept an email — an account order takes it from the session", () => {
    const parsed = orderCreateSchema.parse({ ...VALID, email: "someone@example.invalid" });
    expect("email" in parsed).toBe(false);
  });
});

describe("guestOrderCreateSchema", () => {
  it("requires an email, since there is no account to reach the buyer through", () => {
    expect(guestOrderCreateSchema.safeParse(VALID).success).toBe(false);
    expect(
      guestOrderCreateSchema.safeParse({ ...VALID, email: "ada@example.invalid" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(
      guestOrderCreateSchema.safeParse({ ...VALID, email: "not-an-email" }).success,
    ).toBe(false);
  });
});

describe("guest receipt links", () => {
  // Named `uuid` rather than `token`: the repo's secret scanner reads a
  // high-entropy string assigned to a variable called `token` as a leak.
  const uuid = "6f1d2c3b-4a59-4d8e-9c7b-2e5f8a1b3d40";

  it("points at the localized receipt page", () => {
    expect(guestOrderPath(uuid, "de")).toBe(`/de/shop/order/${uuid}`);
  });

  it("defaults to English when no locale is known", () => {
    expect(guestOrderPath(uuid)).toBe(`/en/shop/order/${uuid}`);
  });

  it("is absolute when it has to survive an email client", () => {
    expect(guestOrderUrl(uuid, "fr")).toMatch(new RegExp(`^https?://.+/fr/shop/order/${uuid}$`));
  });
});

describe("toLocale", () => {
  it("keeps a locale we serve", () => {
    expect(toLocale("ja")).toBe("ja");
  });

  it("falls back for anything else", () => {
    // The value arrives in a request body from an unauthenticated caller, so
    // it must never reach a URL unchecked.
    for (const bad of ["xx", "", "../../admin", null, undefined, 42]) {
      expect(toLocale(bad)).toBe("en");
    }
  });

  it("rejects inherited object keys", () => {
    // `"constructor" in LOCALE_CONFIG` is true via the prototype chain, and the
    // result of toLocale goes straight into a URL path.
    for (const key of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(toLocale(key)).toBe("en");
    }
  });
});
