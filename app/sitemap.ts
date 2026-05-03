import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config/app";
import { getInstance } from "@/lib/db";
import { pets, adoptionListings, vetProfiles, sitterProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE = APP_URL;
const LOCALES = ["en", "de", "fr", "es", "ja", "zh", "ko", "tr", "ar"];

const MARKETING_PATHS = [
  { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
  { path: "/features", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/pros", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/species/dog", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/species/cat", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/species/horse", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/adopt", changeFrequency: "daily" as const, priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getInstance();

  const [publicPets, availableListings, vetUserIds, sitterUserIds] = await Promise.all([
    db.select({ handle: pets.handle, updatedAt: pets.updatedAt }).from(pets).where(eq(pets.isPublic, true)),
    db
      .select({ id: adoptionListings.id, updatedAt: adoptionListings.updatedAt })
      .from(adoptionListings)
      .where(eq(adoptionListings.status, "available")),
    db.select({ userId: vetProfiles.userId, updatedAt: vetProfiles.updatedAt }).from(vetProfiles),
    db.select({ userId: sitterProfiles.userId, updatedAt: sitterProfiles.updatedAt }).from(sitterProfiles),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static marketing pages — one per locale
  for (const locale of LOCALES) {
    for (const { path, changeFrequency, priority } of MARKETING_PATHS) {
      entries.push({ url: `${BASE}/${locale}${path}`, lastModified: now, changeFrequency, priority });
    }
  }

  // Dynamic: public pet influencer profiles — one per locale per pet
  for (const pet of publicPets) {
    if (!pet.handle) continue;
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/pets/${pet.handle}`,
        lastModified: pet.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Dynamic: available adoption listings — one per locale per listing
  for (const listing of availableListings) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/adopt/${listing.id}`,
        lastModified: listing.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // Dynamic: professional profiles — merged dedup by userId
  const proUserIds = new Map<string, Date>();
  for (const v of vetUserIds) proUserIds.set(v.userId, v.updatedAt);
  for (const s of sitterUserIds) proUserIds.set(s.userId, s.updatedAt);

  for (const [userId, updatedAt] of proUserIds) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE}/${locale}/pros/${userId}`,
        lastModified: updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
