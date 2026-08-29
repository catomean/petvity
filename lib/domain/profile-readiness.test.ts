import { describe, it, expect } from "vitest";
import { profileSteps, profileProgress, isProfileLive } from "./profile-readiness";

const LONG_BIO = "I have groomed dogs and cats for eleven years in this city.";

describe("profileSteps", () => {
  it("an empty groomer profile has nothing done", () => {
    const steps = profileSteps("groomer", {});
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(isProfileLive(steps)).toBe(false);
    expect(profileProgress(steps)).toBe(0);
  });

  it("a complete groomer profile is live", () => {
    const steps = profileSteps("groomer", {
      salonName: "Salon X",
      services: "bath_brush",
      priceFrom: 5000,
      city: "Zurich",
      country: "CH",
      bio: LONG_BIO,
      phone: "+41 1",
      isAcceptingClients: true,
    });
    expect(isProfileLive(steps)).toBe(true);
    expect(profileProgress(steps)).toBe(1);
  });

  it("a too-short bio does not count", () => {
    const steps = profileSteps("groomer", { bio: "hi" });
    expect(steps.find((s) => s.key === "bio")!.done).toBe(false);
  });

  it("a zero price does not count as priced", () => {
    const steps = profileSteps("pet_sitter", { pricePerDay: 0 });
    expect(steps.find((s) => s.key === "price")!.done).toBe(false);
  });

  // The directory lists a temporarily-full professional and badges them as not
  // accepting, so readiness must not claim they are invisible. This mirrors the
  // listing conditions in app/api/{vets,sitters,groomers}/route.ts, where
  // isAcceptingClients is an optional filter rather than a requirement.
  it("a complete profile is live even while not accepting clients", () => {
    const steps = profileSteps("veterinarian", {
      clinicName: "C",
      specialty: "S",
      city: "Zurich",
      country: "CH",
      bio: LONG_BIO,
      phone: "+41",
      isAcceptingClients: false,
    });
    expect(isProfileLive(steps)).toBe(true);
    expect(steps.some((s) => s.key === "accepting")).toBe(false);
  });

  it("a seller needs at least one product", () => {
    const base = { displayName: "Store", bio: LONG_BIO, city: "Zurich", country: "CH" };
    expect(isProfileLive(profileSteps("seller", { ...base, productCount: 0 }))).toBe(false);
    expect(isProfileLive(profileSteps("seller", { ...base, productCount: 2 }))).toBe(true);
  });

  it("progress is a fraction of completed steps", () => {
    const steps = profileSteps("pet_sitter", { services: "walking", pricePerDay: 3000 });
    expect(profileProgress(steps)).toBeGreaterThan(0);
    expect(profileProgress(steps)).toBeLessThan(1);
  });
});
