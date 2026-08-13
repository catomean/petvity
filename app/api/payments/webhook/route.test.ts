import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const ENV_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function req(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers,
    body: "{}",
  });
}

describe("POST /api/payments/webhook", () => {
  it("returns 503 when payments are not configured", async () => {
    const res = await POST(req());
    expect(res.status).toBe(503);
  });

  it("returns 400 without a stripe-signature header when configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    const res = await POST(req());
    expect(res.status).toBe(400);
  });

  it("rejects a forged signature", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    const res = await POST(req({ "stripe-signature": "t=1,v1=forged" }));
    expect(res.status).toBe(400);
  });
});
