import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { APP, APP_URL } from "@/lib/config/app";
import { getInstance } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { parseBlogBody } from "@/lib/domain/blog-markup";
import { formatDateShort } from "@/lib/utils/format";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/i18n/alternates";

/** Posts are edited in the admin, so this must not be baked in at build time. */
export const dynamic = "force-dynamic";

/** cache() dedupes the lookup between generateMetadata and the page body,
 *  which would otherwise query for the same post twice per request. */
const getPost = cache(async (slug: string) => {
  const db = getInstance();
  return db.query.blogPosts.findFirst({
    // A draft must 404 publicly, not merely be unlisted — otherwise anyone who
    // guesses the slug reads unpublished writing.
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")),
  });
});

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = `${post.title} · ${APP.name}`;
  return {
    title,
    description: post.excerpt,
    openGraph: { title, description: post.excerpt, type: "article" },
    twitter: { card: "summary", title, description: post.excerpt },
    alternates: buildAlternates(`/blog/${slug}`),
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const t = await getTranslations({ locale, namespace: "blog" });

  const publishedAt = post.publishedAt ?? post.createdAt;
  const blocks = parseBlogBody(post.body);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: publishedAt.toISOString(),
    url: `${APP_URL}/${locale}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: APP.name },
  };

  return (
    <div className="lux-section min-h-screen pt-28 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="section-inner max-w-2xl">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--mist-dark)] hover:text-[var(--platinum)] no-underline mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToBlog")}
        </Link>

        <p className="text-xs text-[var(--mist-dark)] mb-3">
          {formatDateShort(publishedAt.toISOString(), locale)}
        </p>
        <h1 className="ed-title-sm ed-title-on-dark mb-8 leading-tight">{post.title}</h1>

        <div className="space-y-5">
          {blocks.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="text-lg font-semibold text-[var(--platinum)] pt-4">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-2 ps-1">
                  {block.items.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-[var(--platinum-dim)] leading-relaxed"
                    >
                      <span className="text-[var(--champagne)] mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[var(--platinum-dim)] leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--hairline-soft)] flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="btn-editorial justify-center">
            {t("ctaJoin")}
          </Link>
          <Link href={`/${locale}/find`} className="btn-editorial-ghost justify-center">
            {t("ctaFind")}
          </Link>
        </div>
      </article>
    </div>
  );
}
