import { useTranslations } from "next-intl";
import Link from "next/link";
import { APP } from "@/lib/config/app";
import { SPECIES_OPTIONS } from "@/lib/config/species";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <span className="font-bold text-[var(--teal)] text-lg">{APP.name}</span>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="text-[var(--ink2)] hover:text-[var(--teal)] no-underline"
          >
            Log in
          </Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="section-inner py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--ink)] mb-4 leading-tight">
          {t("hero.title")}
        </h1>
        <p className="text-lg text-[var(--muted)] mb-8 max-w-xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <Link href="/register" className="btn-primary text-base px-8 py-3">
          {t("hero.cta")}
        </Link>
      </section>

      {/* Species grid */}
      <section className="section-inner py-12">
        <h2 className="text-center text-sm font-medium uppercase tracking-widest text-[var(--muted)] mb-8">
          Every pet, one platform
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {SPECIES_OPTIONS.slice(0, 8).map((s) => (
            <div
              key={s.value}
              className="flex items-center gap-2 bg-[var(--off)] rounded-full px-4 py-2 text-sm text-[var(--ink2)]"
            >
              <span className="text-lg">{s.label.split(" ")[0]}</span>
              <span>{s.label.split(" ").slice(1).join(" ")}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--off)] py-16">
        <div className="section-inner">
          <h2 className="text-2xl font-bold text-center text-[var(--ink)] mb-10">
            {t("features.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🐾", key: "profiles", desc: "profilesDesc" },
              { icon: "📊", key: "health", desc: "healthDesc" },
              { icon: "🩺", key: "vets", desc: "vetsDesc" },
              { icon: "🏠", key: "adoption", desc: "adoptionDesc" },
            ].map(({ icon, key, desc }) => (
              <div
                key={key}
                className="bg-white rounded-xl border border-[var(--border)] p-5"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-[var(--ink)] mb-1">
                  {t(`features.${key}` as Parameters<typeof t>[0])}
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  {t(`features.${desc}` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-inner py-20 text-center">
        <h2 className="text-3xl font-bold text-[var(--ink)] mb-4">
          Your pet deserves the best care
        </h2>
        <p className="text-[var(--muted)] mb-8">
          Join thousands of pet owners tracking their pet's health on {APP.name}.
        </p>
        <Link href="/register" className="btn-primary text-base px-8 py-3">
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted)]">
        <p>
          © {APP.foundingYear} {APP.name} ·{" "}
          <a href={`mailto:${APP.email}`} className="hover:text-[var(--teal)]">
            {APP.email}
          </a>
        </p>
      </footer>
    </div>
  );
}
