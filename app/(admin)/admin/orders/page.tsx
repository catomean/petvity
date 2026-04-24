"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag, Clock, CheckCircle, Truck, Package, XCircle,
  ChevronDown, ChevronUp, User,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/config/orders";
import type { OrderStatusId } from "@/lib/config/orders";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type OrderStatus = OrderStatusId;

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceCents: number;
  productName: string;
  productImageUrl: string | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string | null; email: string };
  items: OrderItem[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

// Icons are UI-layer; labels/colors sourced from lib/config/orders SSOT
const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle,
  shipped:   Truck,
  delivered: ShoppingBag,
  cancelled: XCircle,
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; color: string; bg: string; className: string }> = {
  pending:   { ...ORDER_STATUS_CONFIG.pending,   icon: STATUS_ICONS.pending },
  confirmed: { ...ORDER_STATUS_CONFIG.confirmed, icon: STATUS_ICONS.confirmed },
  shipped:   { ...ORDER_STATUS_CONFIG.shipped,   icon: STATUS_ICONS.shipped },
  delivered: { ...ORDER_STATUS_CONFIG.delivered, icon: STATUS_ICONS.delivered },
  cancelled: { ...ORDER_STATUS_CONFIG.cancelled, icon: STATUS_ICONS.cancelled },
};

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All orders" },
  ...Object.entries(ORDER_STATUS_CONFIG).map(([value, { label }]) => ({ value, label })),
];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Order row ──────────────────────────────────────────────────────────── */

function OrderRow({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const Icon = cfg.icon;
  const nextStatuses = STATUS_FLOW[order.status];

  async function advanceTo(status: OrderStatus) {
    setUpdating(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setUpdating(false);
    if (data.success) onStatusChange(order.id, status);
  }

  return (
    <div className="border-t border-[var(--border)] first:border-0">
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--off)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.className}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>

        {/* Customer + date */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--ink)] truncate">
            {order.customer.name ?? order.customer.email}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {order.items.length} {order.items.length === 1 ? "item" : "items"} · {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Total */}
        <span className="text-sm font-semibold text-[var(--ink2)] flex-shrink-0">
          {formatPrice(order.totalCents)}
        </span>

        {/* Chevron */}
        <span className="text-[var(--muted)] flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] bg-[var(--off)]">
          {/* Customer detail */}
          <div className="flex items-center gap-2 py-3 border-b border-[var(--border)]">
            <User className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
            <span className="text-xs text-[var(--muted)]">
              {order.customer.name ? `${order.customer.name} · ` : ""}
              {order.customer.email}
            </span>
            <span className="text-xs text-[var(--faint)] ms-auto">
              Updated {formatDateTime(order.updatedAt)}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-2 py-3 border-b border-[var(--border)]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
                  {item.productImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-[var(--faint)]" />
                  )}
                </div>
                <p className="flex-1 text-sm text-[var(--ink)] min-w-0 truncate">{item.productName}</p>
                <p className="text-xs text-[var(--muted)] flex-shrink-0">
                  {item.quantity} × {formatPrice(item.priceCents)}
                </p>
                <p className="text-sm font-medium text-[var(--ink2)] flex-shrink-0 w-16 text-end">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <p className="text-xs text-[var(--muted)] py-2 border-b border-[var(--border)] italic">
              Note: {order.notes}
            </p>
          )}

          {/* Total + actions */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm font-semibold text-[var(--ink)]">
              Total: {formatPrice(order.totalCents)}
            </span>
            {nextStatuses.length > 0 && (
              <div className="flex gap-2">
                {nextStatuses.map((s) => {
                  const nextCfg = STATUS_CONFIG[s];
                  const isCancelAction = s === "cancelled";
                  return (
                    <button
                      key={s}
                      onClick={() => advanceTo(s)}
                      disabled={updating}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                        isCancelAction
                          ? "text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger-bg)]"
                          : "text-[var(--teal)] border-[var(--teal)] hover:bg-[var(--teal-light)]"
                      }`}
                    >
                      {updating ? "Updating…" : nextCfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleStatusChange(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  const displayed = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  // Summary counts
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Orders</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Manage and fulfil customer orders</p>
        </div>
      </div>

      {/* Summary strip */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-1">Total orders</p>
            <p className="text-2xl font-bold text-[var(--ink)]">{orders.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-1">Revenue</p>
            <p className="text-2xl font-bold text-[var(--teal)]">{formatPrice(revenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-bold text-[var(--warn)]">{counts.pending ?? 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-1">In transit</p>
            <p className="text-2xl font-bold text-[var(--ink2)]">{(counts.confirmed ?? 0) + (counts.shipped ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === value
                ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                : "text-[var(--muted)] border-[var(--border)] hover:border-[var(--ink2)] hover:text-[var(--ink2)]"
            }`}
          >
            {label}
            {value !== "all" && counts[value] ? ` (${counts[value]})` : ""}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-[var(--border)] first:border-0">
              <div className="h-6 w-20 bg-[var(--off)] rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-[var(--off)] rounded w-40 animate-pulse" />
                <div className="h-3 bg-[var(--off)] rounded w-24 animate-pulse" />
              </div>
              <div className="h-4 w-12 bg-[var(--off)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-[var(--faint)] mx-auto mb-3" />
          <p className="font-medium text-[var(--ink)] mb-1">
            {statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {statusFilter === "all"
              ? "Orders will appear here once customers start purchasing."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {displayed.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
