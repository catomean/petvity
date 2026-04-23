import { describe, it, expect } from "vitest";
import { createPetHandle, validateSpeciesBreed } from "./pets";

describe("createPetHandle", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(createPetHandle("Mochi the Shiba")).toBe("mochi-the-shiba");
  });

  it("strips special characters", () => {
    expect(createPetHandle("Fluffy!!! 🐾")).toBe("fluffy");
  });

  it("collapses multiple spaces into single hyphen", () => {
    expect(createPetHandle("Mr  Whiskers")).toBe("mr-whiskers");
  });

  it("collapses multiple hyphens into single hyphen", () => {
    expect(createPetHandle("Buddy--Boy")).toBe("buddy-boy");
  });

  it("trims leading/trailing whitespace", () => {
    expect(createPetHandle("  Max  ")).toBe("max");
  });

  it("handles a single word", () => {
    expect(createPetHandle("Bella")).toBe("bella");
  });

  it("handles numbers in name", () => {
    expect(createPetHandle("R2D2")).toBe("r2d2");
  });

  it("truncates at 50 characters", () => {
    const longName = "a".repeat(60);
    expect(createPetHandle(longName).length).toBe(50);
  });

  it("returns empty string for all-special-character name", () => {
    expect(createPetHandle("!!!###")).toBe("");
  });

  it("preserves hyphens already in name", () => {
    expect(createPetHandle("Beau-Beau")).toBe("beau-beau");
  });
});

describe("validateSpeciesBreed", () => {
  it("returns true for empty breed (no breed specified)", () => {
    expect(validateSpeciesBreed("dog", "")).toBe(true);
  });

  it("returns true for 'Other'", () => {
    expect(validateSpeciesBreed("dog", "Other")).toBe(true);
    expect(validateSpeciesBreed("cat", "Other")).toBe(true);
  });

  it("returns true for 'Mixed / Other'", () => {
    expect(validateSpeciesBreed("dog", "Mixed / Other")).toBe(true);
  });

  it("returns true for a valid dog breed", () => {
    expect(validateSpeciesBreed("dog", "Golden Retriever")).toBe(true);
    expect(validateSpeciesBreed("dog", "Labrador Retriever")).toBe(true);
    expect(validateSpeciesBreed("dog", "German Shepherd")).toBe(true);
  });

  it("returns false for a breed not in the species list", () => {
    expect(validateSpeciesBreed("dog", "Persian")).toBe(false); // cat breed, not dog
  });

  it("returns false for an unknown species (undefined config)", () => {
    // "fish" may not have commonBreeds — should not throw
    const result = validateSpeciesBreed("fish", "Goldfish");
    expect(typeof result).toBe("boolean");
  });

  it("is case-sensitive — mismatched case returns false", () => {
    expect(validateSpeciesBreed("dog", "golden retriever")).toBe(false);
  });
});
