"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/config/orders";
import type { OrderStatusId } from "@/lib/config/orders";
import { formatPrice, formatIsoDate } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceCents: number;
  productName: string;
  productImageUrl: string | null;
}

interface Order {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  totalCents: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

// Icons are UI-layer; labels/colors sourced from lib/config/orders SSOT
const STATUS_ICONS: Record<OrderStatusId, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle,
  shipped:   Truck,
  delivered: ShoppingBag,
  cancelled: XCircle,
};


/* ─── Order Card ─────────────────────────────────────────────────────────── */

function OrderCard({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  const t = useTranslations("portal");
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cfg = ORDER_STATUS_CONFIG[order.status];
  const Icon = STATUS_ICONS[order.status];

  async function handleCancel() {
    setCancelling(true);
    await onCancel(order.id);
    setCancelling(false);
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-[var(--off)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-[var(--teal)]" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--ink)] text-sm">
              {t("ordersOrderLabel")} · {formatIsoDate(order.createdAt)}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("ordersItemCount", { count: order.items.length })} · {formatPrice(order.totalCents)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {t(`orderStatus_${order.status}` as Parameters<typeof t>[0])}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--off)] flex items-center justify-center flex-shrink-0">
                {item.productImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="w-4 h-4 text-[var(--faint)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)]">{item.productName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {item.quantity} × {formatPrice(item.priceCents)}
                </p>
              </div>
              <span className="text-sm font-medium text-[var(--ink2)] flex-shrink-0">
                {formatPrice(item.priceCents * item.quantity)}
              </span>
            </div>
          ))}

          {order.notes && (
            <p className="text-xs text-[var(--muted)] pt-1 border-t border-[var(--border)]">
              {t("ordersNote", { text: order.notes })}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--ink)]">{t("ordersTotal", { price: formatPrice(order.totalCents) })}</span>
            {order.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-[var(--danger-text)] hover:underline disabled:opacity-60"
              >
                {cancelling ? t("ordersCancelling") : t("ordersCancelOrder")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function OrdersPage() {
  const t = useTranslations("portal");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  function loadOrders() {
    setLoading(true);
    setFetchError("");
    fetch("/api/orders")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); })
      .catch(() => { setFetchError(t("loadFailed")); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadOrders, []);

  async function cancelOrder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o),
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">{t("orders")}</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{t("ordersSubtitle")}</p>
        </div>
        <Link href="/portal/shop" className="btn-outline flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          {t("shop")}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-20 animate-pulse bg-[var(--off)]" />)}
        </div>
      ) : fetchError ? (
        <div className="card py-12 text-center">
          <p className="text-[var(--danger-text)] font-medium mb-3">{fetchError}</p>
          <button onClick={loadOrders} className="btn-outline text-sm">
            {t("retry")}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">{t("ordersEmpty")}</p>
          <p className="text-sm text-[var(--muted)] mb-5">{t("ordersEmptyDesc")}</p>
          <Link href="/portal/shop" className="btn-primary">{t("ordersBrowseShop")}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
