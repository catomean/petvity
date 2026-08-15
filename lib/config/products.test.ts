import { describe, it, expect } from "vitest";
import {
  PRODUCT_SORT_OPTIONS,
  DEFAULT_PRODUCT_SORT,
  toProductSort,
  productCategoryLabel,
} from "./products";

describe("toProductSort", () => {
  it.each(PRODUCT_SORT_OPTIONS.map((o) => o.id))("keeps the supported value %s", (id) => {
    expect(toProductSort(id)).toBe(id);
  });

  // ?sort= comes straight from the URL, so it is attacker-controlled and is
  // used to index an ORDER BY map — an unrecognised value must resolve to a
  // known sort rather than reaching the query as undefined.
  it.each([undefined, "", "bogus", "price", "__proto__", "constructor", "DROP TABLE"])(
    "falls back to the default for %p",
    (value) => {
      expect(toProductSort(value as string | undefined)).toBe(DEFAULT_PRODUCT_SORT);
    },
  );
});

describe("productCategoryLabel", () => {
  it("labels a known category", () => {
    expect(productCategoryLabel("food")).toBe("Food");
  });

  it("falls back to the raw id rather than rendering nothing", () => {
    expect(productCategoryLabel("unknown-thing")).toBe("unknown-thing");
  });
});
