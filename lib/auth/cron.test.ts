import { describe, it, expect, vi, afterEach } from "vitest";
import { requireCronAuth } from "./cron";

const req = (authorization?: string) =>
  new Request("https://example.test/api/cron/thing", {
    headers: authorization ? { authorization } : {},
  });

afterEach(() => vi.unstubAllEnvs());

describe("an unset secret denies everything", () => {
  // The bug this file exists for. Every cron route used to inline
  //   auth !== `Bearer ${process.env.CRON_SECRET}`
  // which, with the variable unset, compares against the literal string
  // "Bearer undefined" — so sending exactly that got you in. The routes behind
  // this gate wipe the demo account and email every opted-in owner.
  it("refuses `Bearer undefined` when CRON_SECRET is missing", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(requireCronAuth(req("Bearer undefined")).ok).toBe(false);
  });

  it("refuses the literal string 'undefined' too", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(requireCronAuth(req("Bearer ")).ok).toBe(false);
    expect(requireCronAuth(req("Bearer null")).ok).toBe(false);
  });

  it("refuses a whitespace-only secret", () => {
    vi.stubEnv("CRON_SECRET", "   ");
    expect(requireCronAuth(req("Bearer    ")).ok).toBe(false);
  });

  it("refuses even a correct-looking request when unconfigured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(requireCronAuth(req("Bearer anything-at-all")).ok).toBe(false);
  });
});

describe("with a secret configured", () => {
  const SECRET = "a-real-cron-secret-value";

  it("accepts the matching bearer token", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req(`Bearer ${SECRET}`)).ok).toBe(true);
  });

  it("rejects a wrong token", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req("Bearer wrong")).ok).toBe(false);
  });

  it("rejects a token that merely starts correctly", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req(`Bearer ${SECRET.slice(0, -1)}`)).ok).toBe(false);
    expect(requireCronAuth(req(`Bearer ${SECRET}x`)).ok).toBe(false);
  });

  it("rejects a missing header", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req()).ok).toBe(false);
  });

  it("rejects the raw secret without the Bearer scheme", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req(SECRET)).ok).toBe(false);
  });

  it("rejects a different scheme carrying the right secret", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req(`Basic ${SECRET}`)).ok).toBe(false);
  });

  it("is case-sensitive about the secret", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    expect(requireCronAuth(req(`Bearer ${SECRET.toUpperCase()}`)).ok).toBe(false);
  });

  it("answers 401 without saying why", () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    const result = requireCronAuth(req("Bearer wrong"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });
});
