import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Thermometer,
  Heart,
  Weight,
  Zap,
  Smile,
  Wind,
  Users,
  CheckCircle,
} from "lucide-react";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { HEALTH_METRIC_CONFIG, getNormalRange } from "@/lib/config/health-metrics";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ speciesId: string; locale: string }> };

/* ── Static lookup tables — keys map to speciesGuide namespace ── */

const PHYS_LABEL_KEY = {
  temperature: "physTempLabel",
  heart_rate: "physHeartRateLabel",
  weight: "physWeightLabel",
} as const;

const PHYS_DESC_KEY = {
  temperature: "physTempDesc",
  heart_rate: "physHeartRateDesc",
  weight: "physWeightDesc",
} as const;

const EMOT_DESC_KEY: Record<string, string> = {
  energy: "emotEnergyDesc",
  mood: "emotMoodDesc",
  anxiety: "emotAnxietyDesc",
  socialization: "emotSocializationDesc",
};

const EMOT_LABEL_KEY: Record<string, string> = {
  energy: "emotEnergyLabel",
  mood: "emotMoodLabel",
  anxiety: "emotAnxietyLabel",
  socialization: "emotSocializationLabel",
};

const SPECIES_BLURB_KEY: Partial<Record<SpeciesId, string>> = {
  dog: "dogBlurb",
  cat: "catBlurb",
  horse: "horseBlurb",
  bird: "birdBlurb",
  rabbit: "rabbitBlurb",
  guinea_pig: "guineaPigBlurb",
  hamster: "hamsterBlurb",
  reptile: "reptileBlurb",
  fish: "fishBlurb",
};

const CARE_TIP_KEYS: Partial<Record<SpeciesId, string[]>> = {
  dog: ["dogTip1", "dogTip2", "dogTip3", "dogTip4", "dogTip5"],
  cat: ["catTip1", "catTip2", "catTip3", "catTip4", "catTip5"],
  horse: ["horseTip1", "horseTip2", "horseTip3", "horseTip4", "horseTip5"],
  bird: ["birdTip1", "birdTip2", "birdTip3", "birdTip4", "birdTip5"],
  rabbit: ["rabbitTip1", "rabbitTip2", "rabbitTip3", "rabbitTip4", "rabbitTip5"],
  guinea_pig: ["guineaPigTip1", "guineaPigTip2", "guineaPigTip3", "guineaPigTip4", "guineaPigTip5"],
  hamster: ["hamsterTip1", "hamsterTip2", "hamsterTip3", "hamsterTip4", "hamsterTip5"],
  reptile: ["reptileTip1", "reptileTip2", "reptileTip3", "reptileTip4", "reptileTip5"],
  fish: ["fishTip1", "fishTip2", "fishTip3", "fishTip4", "fishTip5"],
};

/* ── Physical metrics shown in the ranges section ── */

const PHYSICAL_INFO = [
  { id: "temperature" as const, icon: Thermometer, unit: "°C" },
  { id: "heart_rate" as const, icon: Heart, unit: " bpm" },
  { id: "weight" as const, icon: Weight, unit: " kg" },
] as const;

const EMOTIONAL_INFO = [
  { id: "energy" as const, icon: Zap },
  { id: "mood" as const, icon: Smile },
  { id: "anxiety" as const, icon: Wind },
  { id: "socialization" as const, icon: Users },
] as const;

/*
 * No generateStaticParams here on purpose: the locale layout's getMessages()
 * needs request context, so a static prerender of this route throws
 * DYNAMIC_SERVER_USAGE at runtime (500 in prod, invisible in dev). Every other
 * marketing page renders dynamically — this one must too.
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { speciesId, locale } = await params;
  const def = SPECIES_CONFIG[speciesId as SpeciesId];
  if (!def || def.id === "other") return { title: APP.name };

  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "speciesGuide" }),
    getTranslations({ locale, namespace: "public" }),
  ]);
  const speciesName = tPub(`species_${speciesId}` as Parameters<typeof tPub>[0]);
  const title = t("metaTitle", { species: speciesName, app: APP.name });
  const description = t("metaDesc", { species: speciesName, app: APP.name });

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: buildAlternates(`/species/${speciesId}`),
  };
}

export default async function SpeciesGuidePage({ params }: Params) {
  const { speciesId, locale } = await params;
  const species = SPECIES_CONFIG[speciesId as SpeciesId];
  if (!species || speciesId === "other") notFound();

  const [t, tPub] = await Promise.all([
    getTranslations({ locale, namespace: "speciesGuide" }),
    getTranslations({ locale, namespace: "public" }),
  ]);

  const speciesName = tPub(`species_${speciesId}` as Parameters<typeof tPub>[0]);
  const speciesLc = speciesName.toLowerCase();

  const tempRange = getNormalRange("temperature", species.id);
  const hrRange = getNormalRange("heart_rate", species.id);
  const wtRange = getNormalRange("weight", species.id);

  const rangeValues = {
    temperature: {
      min: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.min),
      max: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRange.max),
    },
    heart_rate: { min: hrRange.min, max: hrRange.max },
    weight: {
      min: HEALTH_METRIC_CONFIG.weight.toDisplay(wtRange.min),
      max: HEALTH_METRIC_CONFIG.weight.toDisplay(wtRange.max),
    },
  };

  const blurbKey = SPECIES_BLURB_KEY[species.id];
  const tipKeys = CARE_TIP_KEYS[species.id] ?? [];

  return (
    <main className="bg-[var(--obsidian)] text-[var(--platinum)] overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="lux-section py-16 lg:py-24">
        <div className="section-inner text-center">
          <div className="text-7xl mb-4">{species.emoji}</div>
          <h1 className="ed-title mb-4">{t("heroTitle", { species: speciesName })}</h1>
          {blurbKey && (
            <p className="text-lg text-[var(--platinum-dim)] max-w-2xl mx-auto mb-8 leading-relaxed">
              {t(blurbKey as Parameters<typeof t>[0])}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-editorial">
              {t("heroTrackCta", { species: speciesName })}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features" className="btn-editorial-ghost">
              {t("heroFeaturesCta")}
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap text-sm text-[var(--mist-dark)]">
            <span>
              {t("heroLifespan", {
                min: species.typicalLifespanYears.min,
                max: species.typicalLifespanYears.max,
              })}
            </span>
            <span className="hidden sm:inline text-[var(--hairline)]">|</span>
            <span>{t("heroBreedCount", { count: species.commonBreeds.length })}</span>
            <span className="hidden sm:inline text-[var(--hairline)]">|</span>
            <span>{t("heroMetricCount")}</span>
          </div>
        </div>
      </section>

      {/* ── Normal health ranges ─────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-inner">
          <h2 className="ed-title-sm mb-3 text-center">
            {t("rangesTitle", { species: speciesName })}
          </h2>
          <p className="text-[var(--mist-dark)] text-center mb-10 max-w-xl mx-auto">
            {t("rangesDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {PHYSICAL_INFO.map(({ id, icon: Icon, unit }) => {
              const range = rangeValues[id];
              return (
                <div key={id} className="lux-card p-6 text-center">
                  <div className="ed-icon w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--mist-dark)] mb-1">
                    {t(PHYS_LABEL_KEY[id])}
                  </p>
                  <p className="text-xl font-semibold text-[var(--champagne)]">
                    {range.min}–{range.max}
                    <span className="text-sm font-normal text-[var(--mist-dark)] ms-1">{unit}</span>
                  </p>
                  <p className="text-xs text-[var(--mist-dark)] mt-1">{t(PHYS_DESC_KEY[id])}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Emotional metrics ────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 lux-section-raised">
        <div className="section-inner">
          <h2 className="ed-title-sm mb-3 text-center">{t("emotionalTitle")}</h2>
          <p className="text-[var(--mist-dark)] text-center mb-10 max-w-xl mx-auto">
            {t("emotionalDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {EMOTIONAL_INFO.map(({ id, icon: Icon }) => (
              <div key={id} className="lux-card p-5 flex gap-4">
                <div className="ed-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--platinum)] mb-1">
                    {t((EMOT_LABEL_KEY[id] ?? id) as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-sm text-[var(--mist-dark)] leading-relaxed">
                    {t((EMOT_DESC_KEY[id] ?? id) as Parameters<typeof t>[0])}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Common breeds ────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-inner">
          <h2 className="ed-title-sm mb-3 text-center">
            {t("breedsTitle", { species: speciesName })}
          </h2>
          <p className="text-[var(--mist-dark)] text-center mb-10 max-w-xl mx-auto">
            {t("breedsDesc", { species: speciesLc })}
          </p>

          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            {species.commonBreeds.map((breed) => (
              <span key={breed} className="lux-chip">
                {breed}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Care tips ────────────────────────────────────────────────── */}
      {tipKeys.length > 0 && (
        <section className="py-16 lg:py-20 lux-section">
          <div className="section-inner">
            <h2 className="ed-title-sm mb-3 text-center">
              {t("tipsTitle", { species: speciesName })}
            </h2>
            <p className="text-[var(--mist-dark)] text-center mb-10 max-w-xl mx-auto">
              {t("tipsDesc", { species: speciesLc })}
            </p>

            <ul className="space-y-3 max-w-2xl mx-auto">
              {tipKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 lux-card p-4">
                  <CheckCircle className="w-5 h-5 text-[var(--champagne)] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--platinum-dim)] leading-relaxed">
                    {t(key as Parameters<typeof t>[0])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="lux-section-deep relative overflow-hidden py-16 lg:py-24">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--champagne) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[var(--champagne)] opacity-[0.06] pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[var(--champagne)] opacity-[0.06] pointer-events-none"
        />

        <div className="section-inner relative text-center">
          <div className="text-5xl mb-4">{species.emoji}</div>
          <h2 className="ed-title ed-title-on-dark mb-5">
            {t("ctaTitle", { species: speciesLc })}
          </h2>
          <p className="text-lg text-[var(--platinum-dim)] opacity-80 max-w-xl mx-auto mb-10 leading-relaxed">
            {t("ctaDesc")}
          </p>
          <Link href="/register" className="btn-editorial-light">
            {t("ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
