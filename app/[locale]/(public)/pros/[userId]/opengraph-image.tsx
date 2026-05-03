import { ImageResponse } from "next/og";
import { getInstance } from "@/lib/db";
import { vetProfiles, sitterProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { APP } from "@/lib/config/app";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ userId: string }> };

export default async function OgImage({ params }: Params) {
  const { userId } = await params;
  const db = getInstance();

  const [[vetRow], [sitterRow]] = await Promise.all([
    db
      .select({ name: users.name, specialty: vetProfiles.specialty })
      .from(vetProfiles)
      .innerJoin(users, eq(users.id, vetProfiles.userId))
      .where(eq(vetProfiles.userId, userId))
      .limit(1),
    db
      .select({ name: users.name })
      .from(sitterProfiles)
      .innerJoin(users, eq(users.id, sitterProfiles.userId))
      .where(eq(sitterProfiles.userId, userId))
      .limit(1),
  ]);

  const isVet = !!vetRow;
  const name = vetRow?.name ?? sitterRow?.name ?? (isVet ? "Veterinarian" : "Pet Sitter");
  const role = isVet ? "Veterinarian" : "Pet Sitter";
  const specialty = isVet && vetRow?.specialty ? ` · ${vetRow.specialty}` : "";
  const accent = isVet ? "#0D6E78" : "#E06B3A";
  const accentDark = isVet ? "#0A5860" : "#C85E30";
  const icon = isVet ? "🩺" : "🏠";

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
          background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Avatar circle */}
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
          {icon}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
            marginBottom: 12,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {name}
        </div>

        {/* Role + specialty */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.8)",
            marginBottom: 40,
          }}
        >
          {role}{specialty}
        </div>

        {/* App badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 32,
            padding: "10px 24px",
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
