import Link from "next/link";
import {
  CheckCircle, ArrowRight, Zap, Shield, Users, Globe,
} from "lucide-react";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything an individual pet owner needs to track and understand their pet's health.",
    cta: "Get started free",
    href: "/register",
    primary: false,
    features: [
      "Unlimited pets",
      "All 7 health metrics + Digital Twin",
      "Vaccination schedule & reminders",
      "Health records (vet visits, medications, lab results)",
      "Wellness signals (Healthy / Watch / Concern)",
      "Find & book vets and sitters",
      "Pet marketplace (food, accessories, essentials)",
      "Adoption listings — list or adopt",
      "Public pet profiles",
      "9 languages including Arabic (RTL)",
      "Email health alerts",
      "Mobile-optimised app",
    ],
    notIncluded: [
      "Priority email support",
      "API access",
      "White-label for clinics",
    ],
  },
  {
    name: "Pro",
    price: "Coming soon",
    period: "",
    desc: "For breeders, show animals, and professional pet businesses that need advanced tools.",
    cta: "Join the waitlist",
    href: "mailto:hello@petvity.com?subject=Petvity Pro Waitlist",
    primary: true,
    features: [
      "Everything in Free",
      "Priority email support",
      "Advanced analytics & trends",
      "API access for custom integrations",
      "Bulk import from vet systems",
      "Custom branding for public profiles",
      "Team accounts (share access with your vet)",
      "Export health data as PDF",
    ],
    notIncluded: [],
  },
  {
    name: "Clinic",
    price: "Coming soon",
    period: "",
    desc: "White-label solution for veterinary clinics to manage client pets and send automated care reminders.",
    cta: "Contact us",
    href: "mailto:hello@petvity.com?subject=Petvity Clinic",
    primary: false,
    features: [
      "Everything in Pro",
      "White-label with your clinic branding",
      "Client pet portal (your patients, your data)",
      "Automated vaccination reminders on your behalf",
      "Integration with common vet practice software",
      "Dedicated onboarding support",
      "SLA-backed uptime guarantee",
    ],
    notIncluded: [],
  },
];

const FAQ = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. The Free plan is designed to be the permanent home for individual pet owners. We'll never move core health-tracking features behind a paywall.",
  },
  {
    q: "How many pets can I add?",
    a: "Unlimited. Whether you have one dog or a stable of horses, the Free plan handles it all.",
  },
  {
    q: "Which species are supported?",
    a: "Dogs, cats, horses, birds, rabbits, guinea pigs, hamsters, reptiles, fish, and more via the 'Other' category. Each species has its own normal ranges for health metrics — a horse's normal temperature is different from a cat's.",
  },
  {
    q: "When will Pro and Clinic plans launch?",
    a: "The core platform — health tracking, digital twin, vet/sitter network, marketplace, and adoption — is live and free. Pro and Clinic tiers for breeders and veterinary businesses are next. Join the waitlist to be notified.",
  },
  {
    q: "Can I use Petvity in my language?",
    a: "Yes — Petvity supports English, German, French, Spanish, Japanese, Chinese, Korean, Turkish, and Arabic (with full right-to-left layout).",
  },
  {
    q: "Is my data secure?",
    a: "All data is owner-scoped — you can only see your own pets. We use encrypted connections, bcrypt password hashing, and host on Vercel's global edge infrastructure.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <MarketingNav />

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
            Simple, honest pricing
          </div>
          <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
            Free for pet owners,<br />
            <span className="text-[var(--teal)]">always</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed">
            Individual pet owners get everything — no credit card, no time limit.
            Pro and Clinic plans are coming for breeders and veterinary businesses.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 bg-[var(--off)]">
        <div className="section-inner">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map(({ name, price, period, desc, cta, href, primary, features, notIncluded }) => (
              <div
                key={name}
                className={`card p-8 flex flex-col relative ${
                  primary
                    ? "border-[var(--teal)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--teal)]"
                    : ""
                }`}
              >
                {primary && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[var(--teal)] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      Most requested
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">{name}</p>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className={`font-extrabold tracking-tight ${price === "$0" ? "text-4xl text-[var(--ink)]" : "text-xl text-[var(--muted)]"}`}>
                      {price}
                    </span>
                    {period && (
                      <span className="text-sm text-[var(--muted)]">/ {period}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
                </div>

                <Link
                  href={href}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-semibold mb-7 transition-colors no-underline ${
                    primary
                      ? "bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)]"
                      : "btn-outline"
                  }`}
                >
                  {cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--ink2)]">
                      <CheckCircle className="w-4 h-4 text-[var(--green)] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--faint)] line-through">
                      <CheckCircle className="w-4 h-4 text-[var(--faint)] flex-shrink-0 mt-0.5" />
                      {f}
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
              { icon: Shield, label: "No credit card ever required" },
              { icon: Users, label: "Unlimited pets on Free plan" },
              { icon: Globe, label: "9 languages supported" },
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
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="card p-6">
                <p className="font-semibold text-[var(--ink)] mb-2">{q}</p>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--teal)]">
        <div className="section-inner text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Start tracking your pet&apos;s health today
          </h2>
          <p className="text-white/70 text-lg mb-8">Free forever. No credit card required.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--teal-light)] transition-colors">
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
