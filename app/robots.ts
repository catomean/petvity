import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config/app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
