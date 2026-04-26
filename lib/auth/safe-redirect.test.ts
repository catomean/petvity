import { describe, it, expect } from "vitest";
import { safeReturnTo } from "./safe-redirect";

const FALLBACK = "/portal/dashboard";

describe("safeReturnTo", () => {
  describe("accepts safe same-origin paths", () => {
    it.each([
      "/portal/dashboard",
      "/portal/pets/new",
      "/admin/users",
      "/portal/orders?status=pending",
      "/legal/privacy#section-3",
      "/", // bare root
    ])("%s", (path) => {
      expect(safeReturnTo(path, FALLBACK)).toBe(path);
    });
  });

  describe("rejects open-redirect attempts", () => {
    it.each([
      ["//evil.com",                "protocol-relative"],
      ["//evil.com/portal",         "protocol-relative with path"],
      ["/\\evil.com",               "backslash-prefixed (browser may normalize \\\\ → //)"],
      ["http://evil.com",           "absolute http"],
      ["https://evil.com/portal",   "absolute https"],
      ["javascript:alert(1)",       "javascript: scheme"],
      ["data:text/html,<script>",   "data: scheme"],
      ["evil.com/portal",           "no leading slash"],
      ["",                          "empty string"],
    ])("%s — %s", (input) => {
      expect(safeReturnTo(input, FALLBACK)).toBe(FALLBACK);
    });
  });

  it("returns the fallback when input is null or undefined", () => {
    expect(safeReturnTo(null, FALLBACK)).toBe(FALLBACK);
    expect(safeReturnTo(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
