import { ImageResponse } from "next/og";
import { getInstance } from "@/lib/db";
import { adoptionListings, pets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APP } from "@/lib/config/app";
import { SPECIES_CONFIG } from "@/lib/config/species";
import type { SpeciesId } from "@/lib/config/species";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ listingId: string }> };

export default async function OgImage({ params }: Params) {
  const { listingId } = await params;
  const db = getInstance();

  const [row] = await db
    .select({
      title: adoptionListings.title,
      feeCents: adoptionListings.feeCents,
      location: adoptionListings.location,
      petName: pets.name,
      species: pets.species,
    })
    .from(adoptionListings)
    .innerJoin(pets, eq(pets.id, adoptionListings.petId))
    .where(eq(adoptionListings.id, listingId))
    .limit(1);

  const petName = row?.petName ?? "Pet";
  const title = row?.title ?? "Available for Adoption";
  const species = (row?.species ?? "other") as SpeciesId;
  const emoji = SPECIES_CONFIG[species]?.emoji ?? "🐾";
  const location = row?.location ?? null;
  const feeCents = row?.feeCents ?? null;
  const feeLabel = feeCents === null
    ? "Free"
    : `$${(feeCents / 100).toFixed(0)} adoption fee`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E06B3A 0%, #C85E30 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Pet emoji circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 28,
            border: "4px solid rgba(255,255,255,0.3)",
          }}
        >
          {emoji}
        </div>

        {/* Pet name */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
            marginBottom: 10,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {petName}
        </div>

        {/* Listing title */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.85)",
            marginBottom: 32,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {title}
        </div>

        {/* Meta pills */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: 32,
              padding: "8px 22px",
              fontSize: 18,
              fontWeight: 600,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            💰 {feeLabel}
          </div>
          {location && (
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                borderRadius: 32,
                padding: "8px 22px",
                fontSize: 18,
                fontWeight: 600,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📍 {location}
            </div>
          )}
        </div>

        {/* App badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 32,
            padding: "10px 24px",
            marginTop: 36,
          }}
        >
          <span style={{ fontSize: 22 }}>🐾</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
            {APP.name}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
