import { ImageResponse } from "next/og";
import { APP } from "@/lib/config/app";
import { TOKENS } from "@/lib/config/design-tokens";

export const runtime = "edge";
export const alt = `${APP.name} — ${APP.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: `linear-gradient(135deg, ${TOKENS.obsidian} 0%, ${TOKENS.carbon} 100%)`,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `${TOKENS.champagne}14`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `${TOKENS.champagne}0D`,
            display: "flex",
          }}
        />

        {/* Paw icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: TOKENS.champagne,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            fontSize: 52,
          }}
        >
          🐾
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 300,
            color: TOKENS.platinum,
            letterSpacing: "2px",
            marginBottom: 16,
          }}
        >
          {APP.name}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: TOKENS.platinumDim,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          {APP.tagline}
        </div>

        {/* Signal pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48,
          }}
        >
          {[
            { label: "Healthy", color: TOKENS.green,  bg: `${TOKENS.green}33`  },
            { label: "Watch",   color: TOKENS.warn,   bg: `${TOKENS.warn}33`   },
            { label: "Concern", color: TOKENS.danger,  bg: `${TOKENS.danger}33` },
          ].map(({ label, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg,
                border: `1.5px solid ${color}`,
                borderRadius: 24,
                padding: "8px 20px",
                fontSize: 18,
                fontWeight: 600,
                color,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
