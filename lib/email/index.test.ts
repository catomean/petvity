import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Transport is @bitbaum/mail-kit (a fetch to the Resend HTTP API), so the
// seam mocked here is global fetch — the real mail-kit + adapter code runs.
const fetchMock = vi.fn();

const providerAccepts = () =>
  new Response(JSON.stringify({ id: "sent" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

import { sendEmail } from "./index";

const saved = process.env.RESEND_API_KEY;

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => providerAccepts());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (saved === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = saved;
});

describe("sendEmail", () => {
  it("delivers to a real recipient", async () => {
    await expect(
      sendEmail({ to: "owner@proton.me", subject: "Hi", html: "<p>hi</p>" }),
    ).resolves.toEqual({ sent: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // Each of these is a fixture the e2e walkthrough or smoke timer creates. They
  // are real database rows, so the app sends them real mail — and every send is
  // a hard bounce against the reputation that carries real password resets.
  it.each([
    "e2e-owner-1786786004@petvity.orangecat.ch",
    "render-check-1968120@petvity.orangecat.ch",
    "demo@petvity.com",
    "milo@petvity.com",
    "fixture@somewhere.invalid",
    "fixture@somewhere.test",
  ])("never puts %s on the wire", async (to) => {
    await expect(
      sendEmail({ to, subject: "Welcome to Petvity!", html: "<p>hi</p>" }),
    ).resolves.toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("suppresses without throwing, so callers behave as they do with no API key", async () => {
    // Every caller ignores the return value and only cares about throw/no-throw
    // (the cron marks a queue row failed on throw). Suppression must not look
    // like a failure, or queued items would retry forever.
    await expect(sendEmail({ to: "e2e-vet-1@petvity.orangecat.ch", subject: "s", html: "h" }))
      .resolves.not.toThrow;
  });

  it("reports unconfigured mail as not sent, without touching the wire", async () => {
    // mail-kit's guard: a placeholder key looks configured and delivers to
    // nobody, so it counts as unconfigured.
    process.env.RESEND_API_KEY = "re_placeholder_123"; // gitleaks:allow — literally a placeholder
    await expect(sendEmail({ to: "owner@proton.me", subject: "s", html: "h" })).resolves.toEqual({
      sent: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still throws on a genuine Resend error", async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: "rate limited" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await expect(sendEmail({ to: "owner@proton.me", subject: "s", html: "h" })).rejects.toThrow(
      /rate limited/,
    );
  });
});
