import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { requireSession, requireRole, requireAdmin } from "./guards";
import { auth } from "@/lib/auth";

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "admin", email: "admin@example.com", name: "Admin" },
  expires: "2099-01-01",
};

const OWNER_SESSION = {
  user: { id: "owner-1", role: "pet_owner", email: "owner@example.com", name: "Owner" },
  expires: "2099-01-01",
};

const VET_SESSION = {
  user: { id: "vet-1", role: "veterinarian", email: "vet@example.com", name: "Vet" },
  expires: "2099-01-01",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSession", () => {
  it("returns the session and null error when authenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(OWNER_SESSION as any);
    const { session, error } = await requireSession();
    expect(error).toBeNull();
    expect(session).toEqual(OWNER_SESSION);
  });

  it("returns null session and a 401 NextResponse when no session", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const { session, error } = await requireSession();
    expect(session).toBeNull();
    expect(error).not.toBeNull();
    expect(error!.status).toBe(401);
    const body = await error!.json();
    expect(body).toEqual({ success: false, error: "Unauthorized" });
  });
});

describe("requireRole", () => {
  it("returns the session when role matches", async () => {
    vi.mocked(auth).mockResolvedValueOnce(VET_SESSION as any);
    const { session, error } = await requireRole("veterinarian");
    expect(error).toBeNull();
    expect(session).toEqual(VET_SESSION);
  });

  it("returns 401 when role does NOT match (defense in depth)", async () => {
    // pet_owner trying to claim admin scope must be blocked
    vi.mocked(auth).mockResolvedValueOnce(OWNER_SESSION as any);
    const { session, error } = await requireRole("admin");
    expect(session).toBeNull();
    expect(error!.status).toBe(401);
  });

  it("returns 401 when no session at all", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const { error } = await requireRole("pet_owner");
    expect(error!.status).toBe(401);
  });

  it("returns 401 with the same error shape regardless of failure cause", async () => {
    // Same body shape so client UI can handle uniformly
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const { error: e1 } = await requireRole("admin");
    vi.mocked(auth).mockResolvedValueOnce(OWNER_SESSION as any);
    const { error: e2 } = await requireRole("admin");
    const b1 = await e1!.json();
    const b2 = await e2!.json();
    expect(b1).toEqual(b2);
  });
});

describe("requireAdmin", () => {
  it("delegates to requireRole('admin') and accepts admin sessions", async () => {
    vi.mocked(auth).mockResolvedValueOnce(ADMIN_SESSION as any);
    const { session, error } = await requireAdmin();
    expect(error).toBeNull();
    expect(session).toEqual(ADMIN_SESSION);
  });

  it("rejects every non-admin role", async () => {
    for (const session of [OWNER_SESSION, VET_SESSION]) {
      vi.mocked(auth).mockResolvedValueOnce(session as any);
      const { error } = await requireAdmin();
      expect(error, `${session.user.role} must be rejected`).not.toBeNull();
      expect(error!.status).toBe(401);
    }
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const { error } = await requireAdmin();
    expect(error!.status).toBe(401);
  });
});
