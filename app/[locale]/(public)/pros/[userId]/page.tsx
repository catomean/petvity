import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getInstance } from "@/lib/db";
import { vetProfiles, sitterProfiles, users, reviews } from "@/lib/db/schema";
import { APP, APP_URL } from "@/lib/config/app";
import { BadgeCheck, MapPin, Phone, Star, Stethoscope, Home } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { formatSitterServices } from "@/lib/config/professionals";

/** Cache professional profiles for 60 s — profiles don't change frequently. */
export const revalidate = 60;

type Params = { params: Promise<{ userId: string; locale: string }> };

/* ─── Metadata ───────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { userId, locale } = await params;
  const db = getInstance();
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const name = u?.name ?? "Professional";
  return {
    title: `${name} · ${APP.name}`,
    description: `View ${name}'s professional profile on ${APP.name}`,
    openGraph: {
      title: `${name} · ${APP.name}`,
      url: `${APP_URL}/${locale}/pros/${userId}`,
    },
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? "text-[var(--warn-text)] fill-current" : "text-[var(--faint)]"}`}
        />
      ))}
    </div>
  );
}

const formatServices = formatSitterServices;

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function PublicProPage({ params }: Params) {
  const { userId, locale } = await params;
  const db = getInstance();

  // Query both profile types in parallel; one will be null
  const [[vetRow], [sitterRow], reviewRows] = await Promise.all([
    db
      .select({
        name: users.name,
        bio: vetProfiles.bio,
        specialty: vetProfiles.specialty,
        clinicName: vetProfiles.clinicName,
        clinicAddress: vetProfiles.clinicAddress,
        city: vetProfiles.city,
        country: vetProfiles.country,
        phone: vetProfiles.phone,
        isAcceptingClients: vetProfiles.isAcceptingClients,
        isVerified: vetProfiles.isVerified,
      })
      .from(vetProfiles)
      .innerJoin(users, eq(users.id, vetProfiles.userId))
      .where(eq(vetProfiles.userId, userId))
      .limit(1),

    db
      .select({
        name: users.name,
        bio: sitterProfiles.bio,
        services: sitterProfiles.services,
        pricePerDay: sitterProfiles.pricePerDay,
        city: sitterProfiles.city,
        country: sitterProfiles.country,
        phone: sitterProfiles.phone,
        isAcceptingClients: sitterProfiles.isAcceptingClients,
        isVerified: sitterProfiles.isVerified,
      })
      .from(sitterProfiles)
      .innerJoin(users, eq(users.id, sitterProfiles.userId))
      .where(eq(sitterProfiles.userId, userId))
      .limit(1),

    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.reviewerId))
      .where(eq(reviews.professionalId, userId))
      .orderBy(desc(reviews.createdAt)),
  ]);

  if (!vetRow && !sitterRow) notFound();

  const isVet = !!vetRow;
  const profile = vetRow ?? sitterRow!;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  const avgRating =
    reviewRows.length > 0
      ? reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewRows.length
      : null;

  return (
    <div className="min-h-screen bg-[var(--off)]">
      {/* Nav */}
      <nav className="bg-white border-b border-[var(--border)] px-6 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-bold text-[var(--teal)] text-lg no-underline">
          {APP.name}
        </Link>
        <Link href="/login" className="btn-primary text-sm py-2 px-4">
          Book on {APP.name}
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Header band */}
          <div className={`h-24 ${isVet ? "bg-[var(--teal)]" : "bg-[var(--accent)]"}`} />

          <div className="px-6 pb-6">
            {/* Avatar + name */}
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white flex-shrink-0 ${isVet ? "bg-[var(--teal-dark)]" : "bg-[var(--accent-dark)]"}`}>
                {isVet ? <Stethoscope className="w-9 h-9" /> : <Home className="w-9 h-9" />}
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-[var(--ink)]">
                    {profile.name ?? (isVet ? "Veterinarian" : "Pet Sitter")}
                  </h1>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--teal)] bg-[var(--teal-light)] px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {isVet ? "Veterinarian" : "Pet Sitter"}
                  {isVet && vetRow.specialty ? ` · ${vetRow.specialty}` : ""}
                </p>
              </div>
            </div>

            {/* Availability */}
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
              profile.isAcceptingClients
                ? "bg-[var(--green-bg)] text-[var(--green-text)]"
                : "bg-[var(--off)] text-[var(--muted)]"
            }`}>
              {profile.isAcceptingClients ? "Accepting new clients" : "Not accepting clients"}
            </span>

            {/* Rating summary */}
            {avgRating !== null && (
              <div className="flex items-center gap-2 mb-4">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-sm font-medium text-[var(--ink)]">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-[var(--muted)]">
                  ({reviewRows.length} {reviewRows.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Location + phone */}
            <div className="space-y-1.5 mb-4">
              {(location || (isVet && vetRow.clinicName)) && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {isVet && vetRow.clinicName ? `${vetRow.clinicName} · ` : ""}
                    {location}
                  </span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href={`tel:${profile.phone}`} className="hover:text-[var(--teal)] transition-colors">
                    {profile.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-[var(--ink2)] leading-relaxed">{profile.bio}</p>
            )}

            {/* Sitter: services + price */}
            {!isVet && sitterRow && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                {sitterRow.services && (
                  <p className="text-sm text-[var(--muted)]">{formatServices(sitterRow.services)}</p>
                )}
                {sitterRow.pricePerDay != null && (
                  <p className="text-sm font-semibold text-[var(--accent)] mt-1">
                    ${(sitterRow.pricePerDay / 100).toFixed(0)}/day
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {reviewRows.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-[var(--ink)] mb-3">
              Reviews ({reviewRows.length})
            </h2>
            <div className="space-y-3">
              {reviewRows.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--teal-light)] flex items-center justify-center text-[var(--teal)] font-bold text-xs flex-shrink-0">
                        {(r.reviewerName ?? "?")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[var(--ink)]">
                        {r.reviewerName ?? "Pet Owner"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRow rating={r.rating} />
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-[var(--ink2)]">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center">
          <p className="font-medium text-[var(--ink)] mb-1">
            Ready to book {profile.name?.split(" ")[0] ?? "this professional"}?
          </p>
          <p className="text-sm text-[var(--muted)] mb-4">
            Sign in to {APP.name} to request an appointment.
          </p>
          <Link href="/login" className="btn-primary">
            Sign in to book
          </Link>
        </div>
      </div>
    </div>
  );
}
