import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "fr", "es", "ja", "zh", "ko", "tr", "ar"],
  defaultLocale: "en",
});
