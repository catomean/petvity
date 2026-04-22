import Link from "next/link";
import { PawPrint } from "lucide-react";
import { APP } from "@/lib/config/app";

const LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "#" },
  ],
  Guides: [
    { label: "🐕 Dog health", href: "/species/dog" },
    { label: "🐈 Cat health", href: "/species/cat" },
    { label: "🐴 Horse health", href: "/species/horse" },
    { label: "About", href: "/about" },
  ],
  Company: [
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Support: [
    { label: "Help centre", href: "#" },
    { label: "Contact us", href: `mailto:${APP.supportEmail}` },
    { label: "Status", href: "#" },
    { label: "Community", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

export default function MarketingFooter() {
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
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">
                {section}
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
            © {APP.foundingYear} {APP.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-xs text-stone-500 hover:text-stone-300 no-underline transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
