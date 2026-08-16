import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, clientKey, __resetRateLimits } from "./rate-limit";

const OPTS = { limit: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimits());

  it("allows exactly `limit` requests in a window", () => {
    const now = 1_000_000;
    expect(rateLimit("a", OPTS, now).ok).toBe(true);
    expect(rateLimit("a", OPTS, now).ok).toBe(true);
    expect(rateLimit("a", OPTS, now).ok).toBe(true);
    expect(rateLimit("a", OPTS, now).ok).toBe(false);
  });

  it("keeps separate allowances per key", () => {
    const now = 1_000_000;
    rateLimit("a", OPTS, now);
    rateLimit("a", OPTS, now);
    rateLimit("a", OPTS, now);
    // A blocked shopper must not block everyone else on the site.
    expect(rateLimit("b", OPTS, now).ok).toBe(true);
  });

  it("reopens once the window has passed", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) rateLimit("a", OPTS, now);
    expect(rateLimit("a", OPTS, now).ok).toBe(false);
    expect(rateLimit("a", OPTS, now + OPTS.windowMs).ok).toBe(true);
  });

  it("reports how long to wait", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) rateLimit("a", OPTS, now);
    const result = rateLimit("a", OPTS, now + 15_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterSeconds).toBe(45);
  });

  it("does not consume allowance on a rejected request", () => {
    // Otherwise a client hammering the endpoint would extend its own lockout
    // indefinitely without ever hitting the window boundary.
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) rateLimit("a", OPTS, now);
    for (let i = 0; i < 10; i++) rateLimit("a", OPTS, now + 30_000);
    expect(rateLimit("a", OPTS, now + OPTS.windowMs).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("takes the original client from x-forwarded-for", () => {
    const req = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientKey(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.test", {
      headers: { "x-real-ip": "203.0.113.9" },
    });
    expect(clientKey(req)).toBe("203.0.113.9");
  });

  it("groups headerless requests rather than crashing", () => {
    expect(clientKey(new Request("https://example.test"))).toBe("unknown");
  });
});
