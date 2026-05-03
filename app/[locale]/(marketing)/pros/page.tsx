import Link from "next/link";
import {
  Stethoscope, Heart, CheckCircle, ArrowRight, Star,
  CalendarDays, Shield, TrendingUp, Users, Brain, Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pros" });
  const title = t("metaTitle", { app: APP.name });
  const description = t("metaDesc");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: buildAlternates("/pros"),
  };
}

const VET_BENEFIT_ICONS = [Brain, TrendingUp, Shield, Star, CalendarDays, Users] as const;
const SITTER_BENEFIT_ICONS = [Heart, TrendingUp, Shield, Star, CalendarDays, Zap] as const;

const VET_BENEFIT_KEYS   = ["vb1","vb2","vb3","vb4","vb5","vb6"] as const;
const SITTER_BENEFIT_KEYS = ["sb1","sb2","sb3","sb4","sb5","sb6"] as const;

const VET_STEP_KEYS    = ["vs1","vs2","vs3"] as const;
const SITTER_STEP_KEYS = ["ss1","ss2","ss3"] as const;

export default async function ProsPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pros" });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        <div aria-hidden className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

        <div className="section-inner relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
              <Stethoscope className="w-3 h-3" />
              {t("heroEyebrow")}
            </div>

            <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
              {t("heroTitle")}
            </h1>

            <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-9 max-w-2xl">
              {t("heroDesc")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register?role=vet" className="btn-primary text-base px-7 py-3.5 justify-center">
                <Stethoscope className="w-4 h-4" />
                {t("ctaVetButton")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?role=sitter" className="btn-outline text-base px-7 py-3.5 justify-center">
                <Heart className="w-4 h-4" />
                {t("ctaSitterButton")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Vet benefits */}
      <section id="veterinarians" className="py-24 md:py-32 bg-[var(--off)]">
        <div className="section-inner">
          <div className="text-center mb-16">
            <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-5">
              <Stethoscope className="w-7 h-7 text-[var(--teal)]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal)] mb-3">
              {t("vetTabLabel")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              {t("vetHeroTitle")}
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              {t("vetHeroDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {VET_BENEFIT_KEYS.map((key, i) => {
              const Icon = VET_BENEFIT_ICONS[i];
              return (
                <div key={key} className="card p-7">
                  <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--teal)]" />
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{t(key)}</p>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-8">
            <h3 className="text-xl font-bold text-[var(--ink)] mb-8 text-center">
              {t("vetHowTitle")}
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {VET_STEP_KEYS.map((key, i) => (
                <div key={key} className="text-center relative">
                  {i < 2 && (
                    <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-[var(--teal)] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgb(13_110_120/0.25)]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-[var(--ink2)]">{t(key)}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/register?role=vet" className="btn-primary">
                {t("vetCtaButton")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sitter benefits */}
      <section id="sitters" className="py-24 md:py-32 bg-white">
        <div className="section-inner">
          <div className="text-center mb-16">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-7 h-7 text-pink-500" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-500 mb-3">
              {t("sitterTabLabel")}
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tight mb-5">
              {t("sitterHeroTitle")}
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
              {t("sitterHeroDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {SITTER_BENEFIT_KEYS.map((key, i) => {
              const Icon = SITTER_BENEFIT_ICONS[i];
              return (
                <div key={key} className="card p-7">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-pink-500" />
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{t(key)}</p>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div className="bg-[var(--off)] rounded-2xl p-8">
            <h3 className="text-xl font-bold text-[var(--ink)] mb-8 text-center">
              {t("sitterHowTitle")}
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {SITTER_STEP_KEYS.map((key, i) => (
                <div key={key} className="text-center relative">
                  {i < 2 && (
                    <div aria-hidden className="hidden md:block absolute top-7 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-[var(--border)]" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgb(236_72_153/0.25)]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-[var(--ink2)]">{t(key)}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/register?role=sitter" className="btn-primary" style={{ background: "var(--accent)" }}>
                {t("sitterCtaButton")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-20 bg-[var(--off)] border-y border-[var(--border)]">
        <div className="section-inner">
          <h2 className="text-3xl font-extrabold text-[var(--ink)] text-center mb-10">
            {t("trustTitle")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(["trust1","trust2","trust3"] as const).map((key) => (
              <div key={key} className="card p-7 text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-5 h-5 text-[var(--teal)]" />
                </div>
                <h3 className="font-bold text-[var(--ink)] mb-2">{t(`${key}Title`, { app: APP.name })}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{t(`${key}Desc`, { app: APP.name })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[var(--teal)] py-24 md:py-32">
        <div aria-hidden className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="section-inner relative text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            {t("ctaTitle")}
          </h2>
          <p className="text-lg text-[var(--teal-mid)] mb-10 max-w-xl mx-auto leading-relaxed">
            {t("ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=vet"
              className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold text-base px-8 py-4 rounded-xl hover:bg-[var(--teal-light)] transition-colors no-underline shadow-[0_4px_20px_rgb(0_0_0/0.15)]"
            >
              <Stethoscope className="w-4 h-4" />
              {t("ctaVetButton")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?role=sitter"
              className="inline-flex items-center gap-2 bg-white/10 text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-white/20 transition-colors no-underline border border-white/20"
            >
              <Heart className="w-4 h-4" />
              {t("ctaSitterButton")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
