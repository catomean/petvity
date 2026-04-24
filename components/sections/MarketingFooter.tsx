import Link from "next/link";
import { PawPrint } from "lucide-react";
import { APP } from "@/lib/config/app";
import { getTranslations } from "next-intl/server";

export default async function MarketingFooter() {
  const t = await getTranslations("footer");

  const LINK_SECTIONS = [
    {
      heading: t("sections.product"),
      links: [
        { label: t("links.features"),   href: "/features" },
        { label: t("links.howItWorks"), href: "/#how-it-works" },
        { label: t("links.pricing"),    href: "/pricing" },
        { label: t("links.adoptAPet"), href: "/adopt" },
      ],
    },
    {
      heading: t("sections.guides"),
      links: [
        { label: t("links.dogHealth"),   href: "/species/dog" },
        { label: t("links.catHealth"),   href: "/species/cat" },
        { label: t("links.horseHealth"), href: "/species/horse" },
      ],
    },
    {
      heading: t("sections.professionals"),
      links: [
        { label: t("links.forVetsSitters"), href: "/pros" },
        { label: t("links.joinAsVet"),      href: "/register?role=vet" },
        { label: t("links.joinAsSitter"),   href: "/register?role=sitter" },
        { label: t("links.contactUs"),      href: `mailto:${APP.supportEmail}` },
      ],
    },
    {
      heading: t("sections.support"),
      links: [
        { label: t("links.helpCentre"), href: "#" },
        { label: t("links.status"),     href: "#" },
        { label: t("links.community"),  href: "#" },
      ],
    },
    {
      heading: t("sections.legal"),
      links: [
        { label: t("links.privacyPolicy"),  href: "#" },
        { label: t("links.termsOfService"), href: "#" },
        { label: t("links.cookiePolicy"),   href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-[var(--ink)] text-white">
      <div className="section-inner py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 no-underline mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal)] flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">{APP.name}</span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed mb-5">
              {APP.tagline}
            </p>
            <a
              href={`mailto:${APP.email}`}
              className="text-sm text-stone-400 hover:text-[var(--teal-mid)] transition-colors no-underline"
            >
              {APP.email}
            </a>
          </div>

          {/* Link columns */}
          {LINK_SECTIONS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
                {heading}
              </p>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-stone-400 hover:text-white transition-colors no-underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            © {APP.foundingYear} {APP.name}. {t("bottom.rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              {t("bottom.privacy")}
            </Link>
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              {t("bottom.terms")}
            </Link>
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              {t("bottom.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
