"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Heart, MapPin, DollarSign } from "lucide-react";
import { APPLICATION_STATUS_CONFIG, LISTING_STATUS_CONFIG } from "@/lib/config/adoptions";
import type { ApplicationStatusId, ListingStatusId } from "@/lib/config/adoptions";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";
import { formatDateShort, formatAdoptionFee } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

interface MyApplication {
  applicationId: string;
  applicationStatus: ApplicationStatusId;
  message: string | null;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  location: string | null;
  feeCents: number | null;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string | null;
  petAvatarUrl: string | null;
}

export default function MyApplicationsPage() {
  const t = useTranslations("portal");
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  function loadApplications() {
    setLoading(true);
    setFetchError("");
    fetch("/api/adoptions?applied=1")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ data }) => { setApplications(data ?? []); setLoading(false); })
      .catch(() => { setFetchError(t("loadFailed")); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadApplications, []);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/portal/adopt"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-1 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {t("myAppsBack")}
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">{t("myAppsTitle")}</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">{t("myAppsSubtitle")}</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-[var(--off)] rounded w-48" />
          <div className="h-5 bg-[var(--off)] rounded w-32" />
          <div className="card h-32 mt-6" />
          <div className="card h-32" />
        </div>
      ) : fetchError ? (
        <div className="card py-12 text-center">
          <p className="text-[var(--danger-text)] font-medium mb-3">{fetchError}</p>
          <button onClick={loadApplications} className="btn-outline text-sm">
            {t("retry")}
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">{t("myAppsEmpty")}</p>
          <p className="text-sm text-[var(--muted)] mb-5">{t("myAppsEmptyDesc")}</p>
          <Link href="/portal/adopt" className="btn-primary">{t("myAppsBrowse")}</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const statusCfg = APPLICATION_STATUS_CONFIG[app.applicationStatus] ?? APPLICATION_STATUS_CONFIG.pending;
            const speciesDef = SPECIES_CONFIG[app.petSpecies as SpeciesId];
            const listingClosed = app.listingStatus !== "available";
            return (
              <div key={app.applicationId} className={`card p-5 ${listingClosed ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-4">
                  {/* Pet avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {app.petAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.petAvatarUrl} alt={app.petName} className="w-full h-full object-cover" />
                    ) : (
                      speciesDef?.emoji ?? "🐾"
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{app.petName}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {speciesDef?.label ?? app.petSpecies}
                          {app.petBreed ? ` · ${app.petBreed}` : ""}
                        </p>
                        <p className="text-sm text-[var(--ink2)] mt-0.5">{app.listingTitle}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusCfg.className}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)] flex-wrap">
                      {app.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {app.location}
                        </span>
                      )}
                      {app.feeCents != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {app.feeCents ? t("myAppsFee", { fee: formatAdoptionFee(app.feeCents) }) : t("adoptFree")}
                        </span>
                      )}
                      <span>{t("myAppsApplied", { date: formatDateShort(app.createdAt) })}</span>
                      {listingClosed && (
                        <span className="text-[var(--muted)]">
                          {t("myAppsListingStatus", { status: LISTING_STATUS_CONFIG[app.listingStatus as ListingStatusId]?.label ?? app.listingStatus })}
                        </span>
                      )}
                    </div>

                    {app.applicationStatus === "approved" && (
                      <p className="text-sm text-[var(--green-text)] font-medium mt-2">
                        {t("myAppsApproved")}
                      </p>
                    )}
                    {app.applicationStatus === "rejected" && (
                      <p className="text-sm text-[var(--muted)] mt-2">
                        {t("myAppsRejected")}
                      </p>
                    )}
                  </div>
                </div>

                {!listingClosed && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <Link
                      href={`/portal/adopt/${app.listingId}`}
                      className="text-sm text-[var(--teal)] hover:underline"
                    >
                      {t("myAppsViewListing")}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
