import { describe, it, expect } from "vitest";
import { isUniqueViolation } from "./errors";

describe("isUniqueViolation", () => {
  it("recognises a bare driver error", () => {
    expect(isUniqueViolation(Object.assign(new Error("dup"), { code: "23505" }))).toBe(true);
  });

  // The shape production actually throws. Drizzle wraps the driver error, so a
  // check that only reads the top-level `code` passes every unit test and still
  // answers 500 on a duplicate — which is exactly what happened live.
  it("recognises the error Drizzle wraps around it", () => {
    const wrapped = Object.assign(new Error("Failed query"), {
      cause: Object.assign(new Error("duplicate key"), { code: "23505" }),
    });
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("recognises it through more than one layer of wrapping", () => {
    const inner = Object.assign(new Error("duplicate key"), { code: "23505" });
    const wrapped = { cause: { cause: inner } };
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it.each([
    ["a different postgres error", Object.assign(new Error("fk"), { code: "23503" })],
    ["a wrapped different error", { cause: { code: "23503" } }],
    ["a plain error", new Error("boom")],
    ["null", null],
    ["undefined", undefined],
    ["a string", "23505"],
  ])("does not claim %s is a unique violation", (_label, value) => {
    expect(isUniqueViolation(value)).toBe(false);
  });

  it("terminates on a self-referencing cause chain", () => {
    // A cycle must not hang the request thread.
    const cyclic: { cause?: unknown } = {};
    cyclic.cause = cyclic;
    expect(isUniqueViolation(cyclic)).toBe(false);
  });
});
