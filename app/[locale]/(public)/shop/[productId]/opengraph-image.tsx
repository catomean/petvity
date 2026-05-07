import { ImageResponse } from "next/og";
import { getInstance } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { APP } from "@/lib/config/app";
import { formatPrice } from "@/lib/utils/format";
import { PRODUCT_CATEGORY_CONFIG } from "@/lib/config/products";
import type { ProductCategoryId } from "@/lib/config/products";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ productId: string }> };

export default async function OgImage({ params }: Params) {
  const { productId } = await params;
  const db = getInstance();

  const [row] = await db
    .select({
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      category: products.category,
    })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  const name = row?.name ?? "Pet Product";
  const description = row?.description ?? null;
  const category = (row?.category ?? "other") as ProductCategoryId;
  const catCfg = PRODUCT_CATEGORY_CONFIG[category];
  const emoji = catCfg?.emoji ?? "📦";
  const categoryLabel = catCfg?.label ?? "Product";
  const price = row?.priceCents != null ? formatPrice(row.priceCents) : null;

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
          background: "linear-gradient(135deg, #0D6E78 0%, #0A5860 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Category icon */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 28,
            border: "4px solid rgba(255,255,255,0.25)",
          }}
        >
          {emoji}
        </div>

        {/* Category label */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          {categoryLabel}
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
            marginBottom: 14,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.15,
          }}
        >
          {name}
        </div>

        {/* Description (truncated) */}
        {description && (
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 28,
              textAlign: "center",
              maxWidth: 760,
              lineHeight: 1.4,
            }}
          >
            {description.length > 100 ? `${description.slice(0, 100)}…` : description}
          </div>
        )}

        {/* Price badge */}
        {price && (
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: 32,
              padding: "10px 28px",
              fontSize: 26,
              fontWeight: 700,
              color: "white",
              marginBottom: 32,
            }}
          >
            {price}
          </div>
        )}

        {/* App badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.12)",
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
