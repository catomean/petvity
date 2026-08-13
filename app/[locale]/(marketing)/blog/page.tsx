import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { APP } from "@/lib/config/app";
import { BLOG_POSTS } from "@/lib/content/blog";
import { formatDateShort } from "@/lib/utils/format";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const title = t("metaTitle", { app: APP.name });
  const description = t("metaDesc", { app: APP.name });
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: buildAlternates("/blog"),
  };
}

export default async function BlogIndexPage({ params }: Params) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <div className="lux-section min-h-screen pt-28 pb-24">
      <div className="section-inner">
        <div className="text-center mb-14">
          <p className="ed-eyebrow mb-3">{t("eyebrow")}</p>
          <h1 className="ed-title">{t("title")}</h1>
          <p className="text-[var(--platinum-dim)] max-w-xl mx-auto mt-4">{t("subtitle")}</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/blog/${post.slug}`}
              className="lux-card lux-card-hover p-7 flex flex-col gap-3 no-underline"
            >
              <p className="text-xs text-[var(--mist-dark)]">{formatDateShort(post.date, locale)}</p>
              <h2 className="text-xl font-semibold text-[var(--platinum)] leading-snug">{post.title}</h2>
              <p className="text-sm text-[var(--platinum-dim)] leading-relaxed">{post.excerpt}</p>
              <span className="text-sm text-[var(--champagne)] inline-flex items-center gap-1.5 mt-1">
                {t("readPost")} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
