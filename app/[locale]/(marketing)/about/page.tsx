import Link from "next/link";
import {
  Heart, Globe, Shield, Zap, ArrowRight, PawPrint,
} from "lucide-react";
import { APP } from "@/lib/config/app";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("metaTitle", { app: APP.name });
  const description = t("metaDesc");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: buildAlternates("/about"),
  };
}

const VALUE_META = [
  { icon: Heart,  color: "bg-[var(--accent-light)] text-[var(--accent)]", titleKey: "v1Title" as const, descKey: "v1Desc" as const },
  { icon: Globe,  color: "bg-[var(--teal-light)] text-[var(--teal)]",     titleKey: "v2Title" as const, descKey: "v2Desc" as const },
  { icon: Shield, color: "bg-blue-50 text-blue-600",                       titleKey: "v3Title" as const, descKey: "v3Desc" as const },
  { icon: Zap,    color: "bg-amber-50 text-amber-600",                     titleKey: "v4Title" as const, descKey: "v4Desc" as const },
] as const;

const STAT_KEYS = [
  { valueKey: "stat1Value" as const, labelKey: "stat1Label" as const },
  { valueKey: "stat2Value" as const, labelKey: "stat2Label" as const },
  { valueKey: "stat3Value" as const, labelKey: "stat3Label" as const },
  { valueKey: "stat4Value" as const, labelKey: "stat4Label" as const },
] as const;

export default async function AboutPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        <div aria-hidden className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

        <div className="section-inner relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
              <PawPrint className="w-3 h-3" />
              {t("heroEyebrow")}
            </div>
            <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
              {t("heroDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission + stats */}
      <section className="py-20 bg-[var(--off)]">
        <div className="section-inner">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
                {t("missionTitle")}
              </p>
              <p className="text-[var(--muted)] leading-relaxed text-lg">
                {t("missionBody")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {STAT_KEYS.map(({ valueKey, labelKey }) => (
                <div key={labelKey} className="card p-7 text-center">
                  <p className="text-4xl font-extrabold text-[var(--teal)] mb-2">{t(valueKey)}</p>
                  <p className="text-sm text-[var(--muted)]">{t(labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="section-inner">
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {VALUE_META.map(({ icon: Icon, color, titleKey, descKey }) => (
              <div key={titleKey} className="card p-7 flex gap-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--ink)] mb-2">{t(titleKey)}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-[var(--off)] border-y border-[var(--border)]">
        <div className="section-inner max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-[var(--ink)] mb-4">
            {t("teamTitle")}
          </h2>
          <p className="text-[var(--muted)] leading-relaxed text-sm">
            {t("teamBody")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--teal)]">
        <div className="section-inner text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            {t("ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--teal-light)] transition-colors">
              {t("ctaButton")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features" className="inline-flex items-center gap-2 bg-white/10 text-white font-bold px-8 py-4 rounded-xl text-base hover:bg-white/20 transition-colors border border-white/20">
              {t("ctaFeatures")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
