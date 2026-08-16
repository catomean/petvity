import { describe, it, expect } from "vitest";
import {
  buyerFromRow,
  buyerToRow,
  isGuest,
  createReceiptToken,
  isReceiptToken,
  BuyerError,
  BUYER_IDENTITY_CHECK,
} from "./buyer";

describe("buyer identity", () => {
  it("reads an account order", () => {
    expect(buyerFromRow({ userId: "u1", guestEmail: null })).toEqual({
      kind: "account",
      userId: "u1",
    });
  });

  it("reads a guest order", () => {
    expect(buyerFromRow({ userId: null, guestEmail: "a@example.invalid" })).toEqual({
      kind: "guest",
      email: "a@example.invalid",
    });
  });

  it("refuses an order that belongs to both", () => {
    expect(() => buyerFromRow({ userId: "u1", guestEmail: "a@example.invalid" })).toThrow(
      BuyerError,
    );
  });

  it("refuses an order that belongs to nobody", () => {
    // The unrepairable state: money taken, nobody to ship to.
    expect(() => buyerFromRow({ userId: null, guestEmail: null })).toThrow(BuyerError);
    expect(() => buyerFromRow({})).toThrow(BuyerError);
    expect(() => buyerFromRow({ userId: "", guestEmail: "" })).toThrow(BuyerError);
  });

  it("writes exactly one column", () => {
    expect(buyerToRow({ kind: "account", userId: "u1" })).toEqual({
      userId: "u1",
      guestEmail: null,
    });
    expect(buyerToRow({ kind: "guest", email: "A@Example.Invalid " })).toEqual({
      userId: null,
      guestEmail: "a@example.invalid",
    });
  });

  it("round-trips", () => {
    for (const buyer of [
      { kind: "account", userId: "u1" } as const,
      { kind: "guest", email: "a@example.invalid" } as const,
    ]) {
      expect(buyerFromRow(buyerToRow(buyer))).toEqual(buyer);
    }
  });

  it("narrows guests", () => {
    expect(isGuest({ kind: "guest", email: "a@example.invalid" })).toBe(true);
    expect(isGuest({ kind: "account", userId: "u1" })).toBe(false);
  });

  it("ships the database constraint alongside the type", () => {
    // A type is a claim; a CHECK is an enforcement. Both, or neither is true.
    expect(BUYER_IDENTITY_CHECK).toContain("<>");
    expect(BUYER_IDENTITY_CHECK).toContain("user_id");
    expect(BUYER_IDENTITY_CHECK).toContain("guest_email");
  });
});

describe("receipt tokens", () => {
  it("mints something unguessable", () => {
    const a = createReceiptToken();
    const b = createReceiptToken();
    expect(a).not.toBe(b);
    expect(isReceiptToken(a)).toBe(true);
  });

  it("does not repeat across many mints", () => {
    const seen = new Set(Array.from({ length: 1000 }, () => createReceiptToken()));
    expect(seen.size).toBe(1000);
  });

  it("rejects anything that is not a token before it reaches a query", () => {
    for (const bad of ["", "1", "not-a-token", "../../etc/passwd", "%00"]) {
      expect(isReceiptToken(bad)).toBe(false);
    }
  });
});
