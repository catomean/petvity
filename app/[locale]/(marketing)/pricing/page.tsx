import Link from "next/link";
import {
  CheckCircle, ArrowRight, Zap, Shield, Users, Globe,
} from "lucide-react";
import type { Metadata } from "next";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  const title = t("metaTitle", { app: APP.name });
  const description = t("metaDesc");
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

const PLAN_FEATURE_KEYS = {
  plan1: ["plan1F1","plan1F2","plan1F3","plan1F4","plan1F5","plan1F6","plan1F7","plan1F8","plan1F9","plan1F10","plan1F11","plan1F12"] as const,
  plan2: ["plan2F1","plan2F2","plan2F3","plan2F4","plan2F5","plan2F6","plan2F7","plan2F8"] as const,
  plan3: ["plan3F1","plan3F2","plan3F3","plan3F4","plan3F5","plan3F6","plan3F7"] as const,
} as const;

const FAQ_KEYS = ["faq1","faq2","faq3","faq4","faq5","faq6"] as const;

export default async function PricingPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });

  const plans = [
    {
      nameKey:   "plan1Name"  as const,
      priceKey:  "plan1Price" as const,
      periodKey: "plan1Period" as const,
      descKey:   "plan1Desc"  as const,
      ctaKey:    "plan1Cta"   as const,
      href:      "/register",
      primary:   false,
      featureKeys: PLAN_FEATURE_KEYS.plan1,
    },
    {
      nameKey:   "plan2Name"  as const,
      priceKey:  "plan2Price" as const,
      periodKey: null,
      descKey:   "plan2Desc"  as const,
      ctaKey:    "plan2Cta"   as const,
      href:      "#",
      primary:   true,
      featureKeys: PLAN_FEATURE_KEYS.plan2,
    },
    {
      nameKey:   "plan3Name"  as const,
      priceKey:  "plan3Price" as const,
      periodKey: null,
      descKey:   "plan3Desc"  as const,
      ctaKey:    "plan3Cta"   as const,
      href:      "#",
      primary:   false,
      featureKeys: PLAN_FEATURE_KEYS.plan3,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[var(--off)] via-white to-[#f0fafb] pointer-events-none"
        />
        <div aria-hidden className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--teal-light)] opacity-30 blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3" />

        <div className="section-inner relative text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
            <Zap className="w-3 h-3" />
            {t("heroEyebrow")}
          </div>
          <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
            {t("heroTitle")}
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 bg-[var(--off)]">
        <div className="section-inner">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(({ nameKey, priceKey, periodKey, descKey, ctaKey, href, primary, featureKeys }) => (
              <div
                key={nameKey}
                className={`card p-8 flex flex-col relative ${
                  primary
                    ? "border-[var(--teal)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--teal)]"
                    : ""
                }`}
              >
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">{t(nameKey)}</p>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className={`font-extrabold tracking-tight ${t(priceKey) === "$0" ? "text-4xl text-[var(--ink)]" : "text-xl text-[var(--muted)]"}`}>
                      {t(priceKey)}
                    </span>
                    {periodKey && (
                      <span className="text-sm text-[var(--muted)]">/ {t(periodKey)}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{t(descKey)}</p>
                </div>

                <Link
                  href={href}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-semibold mb-7 transition-colors no-underline ${
                    primary
                      ? "bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)]"
                      : "btn-outline"
                  }`}
                >
                  {t(ctaKey)}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {featureKeys.map((fk) => (
                    <li key={fk} className="flex items-start gap-2.5 text-sm text-[var(--ink2)]">
                      <CheckCircle className="w-4 h-4 text-[var(--green-text)] flex-shrink-0 mt-0.5" />
                      {t(fk)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 bg-white border-y border-[var(--border)]">
        <div className="section-inner">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            {[
              { icon: Shield, label: t("plan1F12") },
              { icon: Users,  label: t("plan1F1") },
              { icon: Globe,  label: t("plan1F9") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-[var(--ink2)]">
                <div className="w-9 h-9 rounded-xl bg-[var(--teal-light)] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--teal)]" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[var(--off)]">
        <div className="section-inner max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[var(--ink)] tracking-tight text-center mb-12">
            {t("faqTitle")}
          </h2>
          <div className="space-y-4">
            {FAQ_KEYS.map((key) => (
              <div key={key} className="card p-6">
                <p className="font-semibold text-[var(--ink)] mb-2">{t(`${key}Q`, { app: APP.name })}</p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{t(`${key}A`, { app: APP.name })}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--teal)]">
        <div className="section-inner text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-white/70 text-lg mb-8">{t("ctaDesc")}</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--teal-light)] transition-colors">
            {t("ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
