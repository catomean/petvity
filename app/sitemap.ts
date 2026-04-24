import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config/app";

const BASE = APP_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "de", "fr", "es", "ja", "zh", "ko", "tr", "ar"];
  const marketingPaths = [
    "",
    "/features",
    "/about",
    "/pricing",
    "/pros",
    "/species/dog",
    "/species/cat",
    "/species/horse",
    "/adopt",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of marketingPaths) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
