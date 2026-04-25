"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  User,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/config/orders";
import type { OrderStatusId } from "@/lib/config/orders";
import { formatPrice, formatIsoDate } from "@/lib/utils/format";
import { APP } from "@/lib/config/app";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface SellerItem {
  id: string;
  productId: string;
  quantity: number;
  priceCents: number;
  productName: string;
  productImageUrl: string | null;
}

interface SellerOrder {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  totalCents: number;
  notes: string | null;
  createdAt: string;
  buyerName: string | null;
  buyerEmail: string;
  items: SellerItem[];
  sellerSubtotalCents: number;
}

const STATUS_ICONS: Record<OrderStatusId, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: ShoppingBag,
  cancelled: XCircle,
};

/* ─── Order Card ─────────────────────────────────────────────────────────── */

function SellerOrderCard({ order }: { order: SellerOrder }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ORDER_STATUS_CONFIG[order.status];
  const Icon = STATUS_ICONS[order.status];
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

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
              {formatIsoDate(order.createdAt)} · {order.buyerName ?? order.buyerEmail}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(order.sellerSubtotalCents)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted)]" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium text-[var(--ink2)]">{order.buyerName ?? "Buyer"}</span>
            <span>·</span>
            <a href={`mailto:${order.buyerEmail}`} className="text-[var(--teal)] hover:underline">
              {order.buyerEmail}
            </a>
          </div>

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
              Note: {order.notes}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Your subtotal: {formatPrice(order.sellerSubtotalCents)}
            </span>
            <span className="text-xs text-[var(--muted)]">
              Order status managed by {APP.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/seller")
      .then((r) => r.json())
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <Link
            href="/portal/my-products"
            className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--teal)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3 h-3" /> My products
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Orders to fulfill</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Orders containing products you listed in the marketplace.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-[var(--warn-bg)] text-[var(--warn)]">
            <Clock className="w-4 h-4" />
            {pendingCount} awaiting fulfillment
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-20 animate-pulse bg-[var(--off)]" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-1">No orders yet</p>
          <p className="text-sm text-[var(--muted)] mb-5 max-w-xs mx-auto">
            When buyers order one of your listed products, you&apos;ll see it here.
          </p>
          <Link href="/portal/my-products" className="btn-outline">View your products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <SellerOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
