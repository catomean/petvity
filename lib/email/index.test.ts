import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { sendEmail } from "./index";

const saved = process.env.RESEND_API_KEY;

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_key";
  send.mockReset();
  send.mockResolvedValue({ error: null });
});

afterEach(() => {
  if (saved === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = saved;
});

describe("sendEmail", () => {
  it("delivers to a real recipient", async () => {
    await expect(
      sendEmail({ to: "owner@proton.me", subject: "Hi", html: "<p>hi</p>" }),
    ).resolves.toEqual({ sent: true });
    expect(send).toHaveBeenCalledTimes(1);
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
    expect(send).not.toHaveBeenCalled();
  });

  it("suppresses without throwing, so callers behave as they do with no API key", async () => {
    // Every caller ignores the return value and only cares about throw/no-throw
    // (the cron marks a queue row failed on throw). Suppression must not look
    // like a failure, or queued items would retry forever.
    await expect(sendEmail({ to: "e2e-vet-1@petvity.orangecat.ch", subject: "s", html: "h" }))
      .resolves.not.toThrow;
  });

  it("still throws on a genuine Resend error", async () => {
    send.mockResolvedValue({ error: { message: "rate limited" } });
    await expect(sendEmail({ to: "owner@proton.me", subject: "s", html: "h" })).rejects.toThrow(
      /rate limited/,
    );
  });
});
