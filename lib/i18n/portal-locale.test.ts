import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({ cookies: vi.fn(() => Promise.resolve(cookieStore)) }));

import { getPortalLocale } from "./portal-locale";
import { routing } from "@/i18n/routing";

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.get.mockReset();
});

describe("getPortalLocale", () => {
  it("returns the cookie value when it's a supported locale", async () => {
    cookieStore.get.mockReturnValue({ value: "ja" });
    expect(await getPortalLocale()).toBe("ja");
  });

  it("returns defaultLocale when no cookie is set", async () => {
    cookieStore.get.mockReturnValue(undefined);
    expect(await getPortalLocale()).toBe(routing.defaultLocale);
  });

  it("returns defaultLocale when cookie value is unknown", async () => {
    cookieStore.get.mockReturnValue({ value: "klingon" });
    expect(await getPortalLocale()).toBe(routing.defaultLocale);
  });

  it("returns defaultLocale when cookie value is empty string", async () => {
    cookieStore.get.mockReturnValue({ value: "" });
    expect(await getPortalLocale()).toBe(routing.defaultLocale);
  });

  it("accepts every locale in routing.locales", async () => {
    for (const locale of routing.locales) {
      cookieStore.get.mockReturnValue({ value: locale });
      expect(await getPortalLocale(), `cookie=${locale}`).toBe(locale);
    }
  });
});
