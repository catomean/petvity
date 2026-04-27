import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { makeUnsubscribeToken, verifyUnsubscribeToken, makeUnsubscribeUrl } from "./unsubscribe-token";

const ORIGINAL_SECRET = process.env.NEXTAUTH_SECRET;

describe("unsubscribe-token", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-unsubscribe-tokens";
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = ORIGINAL_SECRET;
  });

  it("verifies a token issued for the same user", () => {
    const token = makeUnsubscribeToken("user-1")!;
    expect(verifyUnsubscribeToken("user-1", token)).toBe(true);
  });

  it("rejects a token issued for a different user", () => {
    const token = makeUnsubscribeToken("user-1")!;
    expect(verifyUnsubscribeToken("user-2", token)).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = makeUnsubscribeToken("user-1")!;
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyUnsubscribeToken("user-1", tampered)).toBe(false);
  });

  it("rejects a token of wrong length without throwing", () => {
    expect(verifyUnsubscribeToken("user-1", "short")).toBe(false);
    expect(verifyUnsubscribeToken("user-1", "")).toBe(false);
    expect(verifyUnsubscribeToken("user-1", "x".repeat(200))).toBe(false);
  });

  it("returns false (does not throw) when secret is missing", () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(verifyUnsubscribeToken("user-1", "anything")).toBe(false);
  });

  it("makes a self-contained URL with both u and t parameters", () => {
    const url = makeUnsubscribeUrl("user-1");
    expect(url).toContain("/unsubscribe?");
    expect(url).toContain("u=user-1");
    expect(url).toMatch(/t=[a-f0-9]+/);
  });

  it("URL-encodes user IDs that contain special characters", () => {
    // UUIDs don't, but defense-in-depth — never trust input shape
    const url = makeUnsubscribeUrl("a b/c");
    expect(url).toContain("u=a%20b%2Fc");
  });

  it("re-issues the same token for the same user (deterministic)", () => {
    expect(makeUnsubscribeToken("user-1")).toBe(makeUnsubscribeToken("user-1"));
  });

  it("issues different tokens when the secret changes", () => {
    const a = makeUnsubscribeToken("user-1");
    process.env.NEXTAUTH_SECRET = "rotated-secret";
    const b = makeUnsubscribeToken("user-1");
    expect(a).not.toBe(b);
  });
});
