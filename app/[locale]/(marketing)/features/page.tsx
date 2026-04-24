import Link from "next/link";
import {
  Activity, Syringe, FileText, Pill, Globe, Zap,
  Heart, BarChart3, Bell, Shield, Smartphone, Users,
  ArrowRight, CheckCircle, Brain, Search, ShoppingBag,
} from "lucide-react";
import MarketingNav from "@/components/sections/MarketingNav";
import MarketingFooter from "@/components/sections/MarketingFooter";

const FEATURE_PILLARS = [
  {
    icon: Activity,
    color: "bg-[var(--teal-light)] text-[var(--teal)]",
    title: "Daily health tracking",
    desc: "Log weight, temperature, heart rate, energy, mood, and anxiety in under 60 seconds. Every entry is compared against species-specific normal ranges — automatically.",
    bullets: [
      "7 metrics across physical and emotional health",
      "Species-aware normal ranges (dog ≠ cat ≠ horse)",
      "Upsert-safe: re-log the same day without duplicates",
      "Historical trend view with charts",
    ],
  },
  {
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
    title: "Wellness signals",
    desc: "Three-state scoring (Healthy / Watch / Concern) computed automatically from your logs. No guesswork — Petvity tells you when to pay attention.",
    bullets: [
      "Computed from last 7 days of metrics",
      "Escalates automatically with overdue vaccinations",
      "Shown on dashboard for every pet at a glance",
      "Email alerts when signal reaches Concern",
    ],
  },
  {
    icon: Brain,
    color: "bg-violet-50 text-violet-600",
    title: "Digital twin",
    desc: "A living emotional portrait of your pet, updated with every check-in. See whether they're Thriving, Content, Needing Attention, or Struggling — at a glance.",
    bullets: [
      "Emotional score from mood, energy, anxiety, socialization",
      "Trend indicator: improving / stable / declining",
      "Visible on your dashboard and public pet profile",
      "Powered by the last 30 days of check-ins",
    ],
  },
  {
    icon: Syringe,
    color: "bg-purple-50 text-purple-600",
    title: "Vaccination schedule",
    desc: "Track every vaccine ever administered. Know exactly when the next booster is due — and get reminded before it lapses.",
    bullets: [
      "Full vaccination history per pet",
      "Status: up to date / due soon / overdue",
      "30-day advance reminders via email",
      "Signals escalate when vaccines are overdue",
    ],
  },
  {
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    title: "Health records",
    desc: "Every vet visit, lab result, surgery, dental, and grooming session in one timeline. Arrive at every appointment prepared.",
    bullets: [
      "8 record types: vet visit, surgery, lab result, and more",
      "Vet name, clinic, date, and notes per record",
      "Edit or delete any record at any time",
      "Full history visible in a single scrollable list",
    ],
  },
  {
    icon: Pill,
    color: "bg-[var(--accent-light)] text-[var(--accent)]",
    title: "Medication management",
    desc: "Active prescriptions, dosage schedules, and refill tracking. Never miss a dose or forget when a medication ends.",
    bullets: [
      "Dosage, frequency, and duration tracking",
      "Active / completed / discontinued statuses",
      "Prescribed-by field for multi-vet households",
      "Edit or delete any medication at any time",
    ],
  },
  {
    icon: Search,
    color: "bg-sky-50 text-sky-600",
    title: "Find a vet or sitter",
    desc: "Browse verified local professionals and book a visit directly. When your pet's signal turns Watch, a vet is one tap away.",
    bullets: [
      "Dedicated vet and pet sitter profiles",
      "Booking calendar with start and end dates",
      "Post-visit reviews and star ratings",
      "Admin-verified professional badges",
    ],
  },
  {
    icon: ShoppingBag,
    color: "bg-rose-50 text-rose-600",
    title: "Pet marketplace",
    desc: "Shop for food, accessories, and health essentials without leaving the platform. Order history and status updates in one place.",
    bullets: [
      "Product catalogue with categories and stock levels",
      "Cart and checkout flow",
      "Order history with fulfillment status",
      "Email confirmation on every order",
    ],
  },
  {
    icon: Heart,
    color: "bg-pink-50 text-pink-600",
    title: "Adoption listings",
    desc: "List a pet for adoption or find your next companion — all within Petvity. Applications, approvals, and notifications handled automatically.",
    bullets: [
      "Owner lists pets with traits (good with kids, dogs, cats)",
      "Public browse — no account needed to discover listings",
      "Applicants submit housing type and experience",
      "Owner approves or rejects; applicant gets notified by email",
    ],
  },
  {
    icon: Globe,
    color: "bg-[var(--green-bg)] text-[var(--green)]",
    title: "Public pet profiles",
    desc: "Turn your pet into an influencer. Public pages are shareable, no login required — perfect for show animals, breeders, and proud pet parents.",
    bullets: [
      "Custom handle (petvity.com/pets/luna)",
      "Photo, bio, species, breed, and age",
      "Wellness signal and digital twin visible to visitors",
      "Toggle public / private at any time",
    ],
  },
];

const CROSS_CUTTING = [
  { icon: Smartphone, label: "Mobile-first design", desc: "Works perfectly on every screen size." },
  { icon: Bell, label: "Smart email alerts", desc: "Health alerts and vaccination reminders delivered to your inbox." },
  { icon: Shield, label: "Secure by design", desc: "Your data is yours. Owner-scoped queries, no third-party sharing." },
  { icon: BarChart3, label: "Trend charts", desc: "Visualise weeks and months of health data at a glance." },
  { icon: Users, label: "Multi-pet households", desc: "Unlimited pets. Switch between them in one tap." },
  { icon: Globe, label: "9 languages", desc: "English, German, French, Spanish, Japanese, Chinese, Korean, Turkish, Arabic." },
];

export default function FeaturesPage() {
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

        <div className="section-inner relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[var(--teal-light)] text-[var(--teal)] text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-[var(--teal-mid)]">
            <Zap className="w-3 h-3" />
            Everything in one place
          </div>
          <h1 className="text-[2.8rem] md:text-[3.6rem] font-extrabold text-[var(--ink)] leading-[1.05] tracking-tight mb-6">
            Every feature your pet<br />
            <span className="text-[var(--teal)]">actually needs</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--muted)] leading-relaxed mb-10">
            From daily health logs and digital twins to vets, a marketplace, and
            cross-border adoption — Petvity covers the full lifecycle of pet care,
            for any species, in any language.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary text-base px-7 py-3.5 justify-center">
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="btn-outline text-base px-7 py-3.5 justify-center">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section id="features" className="py-20 bg-[var(--off)]">
        <div className="section-inner">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_PILLARS.map(({ icon: Icon, color, title, desc, bullets }) => (
              <div key={title} className="card p-7 flex flex-col gap-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--ink)] mb-2">{title}</h2>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">{desc}</p>
                  <ul className="space-y-2">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-[var(--ink2)]">
                        <CheckCircle className="w-4 h-4 text-[var(--green)] flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-cutting capabilities */}
      <section className="py-20 bg-white">
        <div className="section-inner">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-4">
              Built for everyday use
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-xl mx-auto">
              The small details that make Petvity genuinely pleasant to use — every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {CROSS_CUTTING.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--off)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--ink)] text-sm mb-1">{label}</p>
                  <p className="text-sm text-[var(--muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--teal)]">
        <div className="section-inner text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to understand your pet better?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Free forever for individual pet owners. No credit card required.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[var(--teal)] font-bold px-8 py-4 rounded-xl text-base hover:bg-[var(--teal-light)] transition-colors">
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
