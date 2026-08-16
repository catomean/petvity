import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2, Package, MapPin, Mail } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getInstance } from "@/lib/db";
import { orders, orderItems, products } from "@/lib/db/schema";
import { APP } from "@/lib/config/app";
import { ORDER_STATUS_CONFIG, type OrderStatusId } from "@/lib/config/orders";
import { countryName } from "@/lib/config/countries";
import { formatPrice } from "@/lib/utils/format";
import { ProductArt } from "@/components/shop/ProductArt";
import ShopNav from "@/components/shop/ShopNav";
import PayNowButton from "@/components/shop/PayNowButton";
import CancelOrderButton from "@/components/shop/CancelOrderButton";
import { paymentsEnabled } from "@/lib/payments/stripe";

/** A receipt reflects a status that changes; it must never be served stale. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  return {
    title: t("orderMetaTitle", { app: APP.name }),
    // The token is the only thing protecting this page — it must never be
    // indexed, followed, or handed to the next site as a referrer.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function GuestOrderPage({ params }: Props) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  const db = getInstance();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicToken, token))
    .limit(1);

  // A wrong or truncated token looks exactly like an order that never existed —
  // deliberately, so the page cannot be used to probe for valid tokens.
  if (!order) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      imageUrl: products.imageUrl,
      category: products.category,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, order.id));

  const statusCfg = ORDER_STATUS_CONFIG[order.status as OrderStatusId];
  const awaitingPayment = paymentsEnabled() && !order.paidAt && order.status !== "cancelled";

  return (
    <div className="min-h-screen bg-[var(--off)]">
      <ShopNav locale={locale} />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Confirmation */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--green-bg)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-[var(--green-text)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">{t("orderThanks")}</h1>
          {order.guestEmail && (
            <p className="text-sm text-[var(--muted)] flex items-center justify-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {t("orderReceiptSent", { email: order.guestEmail })}
            </p>
          )}
          <p className="text-xs text-[var(--muted)] mt-2">{t("orderBookmark")}</p>
        </div>

        {awaitingPayment && (
          <div className="card p-5 mb-5 text-center">
            <p className="font-semibold text-[var(--ink)] mb-1">{t("orderPayTitle")}</p>
            <p className="text-sm text-[var(--muted)] mb-4">{t("orderPayDesc")}</p>
            <PayNowButton token={token} />
          </div>
        )}

        {/* Items */}
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--ink)] flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--muted)]" />
              {t("orderItemsTitle")}
            </h2>
            <span className={`badge ${statusCfg?.badge ?? "badge-neutral"}`}>
              {t(`orderStatus_${order.status}` as Parameters<typeof t>[0])}
            </span>
          </div>

          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--off)] overflow-hidden flex-shrink-0">
                  <ProductArt
                    imageUrl={item.imageUrl}
                    alt={item.productName}
                    category={item.category ?? "other"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {/* A delisted product has no page left to link to. */}
                  {item.productId ? (
                    <Link
                      href={`/${locale}/shop/${item.productId}`}
                      className="text-sm font-medium text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-[var(--ink)]">{item.productName}</span>
                  )}
                  <p className="text-xs text-[var(--muted)]">
                    {t("orderQuantity", { count: item.quantity })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">{t("cartTotal")}</span>
            <span className="text-xl font-bold text-[var(--ink)]">
              {formatPrice(order.totalCents)}
            </span>
          </div>
        </div>

        {/* Delivery */}
        {order.shippingName && (
          <div className="card p-5 mb-5">
            <h2 className="font-semibold text-[var(--ink)] flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[var(--muted)]" />
              {t("orderDeliverTo")}
            </h2>
            <address className="text-sm text-[var(--ink2)] not-italic leading-relaxed">
              {order.shippingName}
              <br />
              {order.shippingLine1}
              <br />
              {order.shippingPostalCode} {order.shippingCity}
              <br />
              {order.shippingCountry ? countryName(order.shippingCountry, locale) : null}
              {order.shippingPhone && (
                <>
                  <br />
                  {order.shippingPhone}
                </>
              )}
            </address>
          </div>
        )}

        <div className="text-center space-y-4">
          <Link href={`/${locale}/shop`} className="btn-outline">
            {t("cartKeepShopping")}
          </Link>
          {/* Only while pending: once a seller has confirmed or shipped it,
              calling it off is a conversation, not a button. */}
          {order.status === "pending" && (
            <div>
              <CancelOrderButton token={token} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
