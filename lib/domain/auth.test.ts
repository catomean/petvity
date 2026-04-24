import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveRole } from "./auth";

/* ─── resolveRole ──────────────────────────────────────────────────────────── */

describe("resolveRole", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 'admin' for emails listed in ADMIN_EMAILS", () => {
    vi.stubEnv("ADMIN_EMAILS", "boss@example.com,admin@example.com");
    expect(resolveRole("boss@example.com")).toBe("admin");
    expect(resolveRole("admin@example.com")).toBe("admin");
  });

  it("is case-insensitive for admin email matching", () => {
    vi.stubEnv("ADMIN_EMAILS", "BOSS@EXAMPLE.COM");
    expect(resolveRole("Boss@Example.Com")).toBe("admin");
  });

  it("admin email wins even when intendedRole is provided", () => {
    vi.stubEnv("ADMIN_EMAILS", "boss@example.com");
    expect(resolveRole("boss@example.com", "veterinarian")).toBe("admin");
  });

  it("returns 'pet_owner' when no intendedRole is given", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(resolveRole("user@example.com")).toBe("pet_owner");
  });

  it("returns 'pet_owner' when intendedRole is explicitly 'pet_owner'", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(resolveRole("user@example.com", "pet_owner")).toBe("pet_owner");
  });

  it("returns 'veterinarian' when intendedRole is 'veterinarian'", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(resolveRole("vet@clinic.com", "veterinarian")).toBe("veterinarian");
  });

  it("returns 'pet_sitter' when intendedRole is 'pet_sitter'", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(resolveRole("sitter@example.com", "pet_sitter")).toBe("pet_sitter");
  });

  it("returns 'pet_owner' when ADMIN_EMAILS is not set", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(resolveRole("anyone@example.com")).toBe("pet_owner");
  });
});
