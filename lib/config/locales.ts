export type LocaleCode =
  | "en"
  | "de"
  | "fr"
  | "es"
  | "ja"
  | "zh"
  | "ko"
  | "tr"
  | "ar";

export type LocaleDef = {
  code: LocaleCode;
  label: string;
  labelEn: string;
  dir: "ltr" | "rtl";
  flag: string;
};

export const LOCALE_CONFIG: Record<LocaleCode, LocaleDef> = {
  en: { code: "en", label: "English",  labelEn: "English",  dir: "ltr", flag: "🇬🇧" },
  de: { code: "de", label: "Deutsch",  labelEn: "German",   dir: "ltr", flag: "🇩🇪" },
  fr: { code: "fr", label: "Français", labelEn: "French",   dir: "ltr", flag: "🇫🇷" },
  es: { code: "es", label: "Español",  labelEn: "Spanish",  dir: "ltr", flag: "🇪🇸" },
  ja: { code: "ja", label: "日本語",   labelEn: "Japanese", dir: "ltr", flag: "🇯🇵" },
  zh: { code: "zh", label: "中文",     labelEn: "Chinese",  dir: "ltr", flag: "🇨🇳" },
  ko: { code: "ko", label: "한국어",   labelEn: "Korean",   dir: "ltr", flag: "🇰🇷" },
  tr: { code: "tr", label: "Türkçe",  labelEn: "Turkish",  dir: "ltr", flag: "🇹🇷" },
  ar: { code: "ar", label: "العربية", labelEn: "Arabic",   dir: "rtl", flag: "🇸🇦" },
};

/** Locales that require right-to-left text direction. */
export const RTL_LOCALES: LocaleCode[] = Object.values(LOCALE_CONFIG)
  .filter((l) => l.dir === "rtl")
  .map((l) => l.code);

export const LOCALE_OPTIONS = Object.values(LOCALE_CONFIG).map(
  ({ code, label, flag }) => ({ value: code, label: `${flag} ${label}` }),
);

/** Canonical default locale — used for links from non-localized contexts (e.g. portal). */
export const DEFAULT_LOCALE: LocaleCode = "en";
