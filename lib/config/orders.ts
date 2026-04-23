/**
 * SSOT for order and booking status display config.
 * Enum values must match orderStatusEnum / bookingStatusEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const ORDER_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]",    className: "bg-[var(--warn-bg)] text-[var(--warn)]" },
  confirmed: { label: "Confirmed", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]",   className: "bg-[var(--green-bg)] text-[var(--green)]" },
  shipped:   { label: "Shipped",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]", className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  delivered: { label: "Delivered", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]", className: "bg-[var(--teal-light)] text-[var(--teal)]" },
  cancelled: { label: "Cancelled", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",        className: "bg-[var(--off)] text-[var(--muted)]" },
} as const;

export type OrderStatusId = keyof typeof ORDER_STATUS_CONFIG;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatusId]?.label ?? status;
}

export const BOOKING_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]",    className: "bg-[var(--warn-bg)] text-[var(--warn)]" },
  confirmed: { label: "Confirmed", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]",   className: "bg-[var(--green-bg)] text-[var(--green)]" },
  cancelled: { label: "Cancelled", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]",        className: "bg-[var(--off)] text-[var(--muted)]" },
  completed: { label: "Completed", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]", className: "bg-[var(--teal-light)] text-[var(--teal)]" },
} as const;

export type BookingStatusId = keyof typeof BOOKING_STATUS_CONFIG;
