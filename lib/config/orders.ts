/**
 * SSOT for order and booking status display config.
 * Enum values must match orderStatusEnum / bookingStatusEnum in lib/db/schema.ts.
 * Icons are intentionally excluded — they are React components and belong in the UI layer.
 */

export const ORDER_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  confirmed: { label: "Confirmed", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  shipped:   { label: "Shipped",   color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  delivered: { label: "Delivered", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
  cancelled: { label: "Cancelled", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
} as const;

export type OrderStatusId = keyof typeof ORDER_STATUS_CONFIG;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatusId]?.label ?? status;
}

export const BOOKING_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-[var(--warn)]",   bg: "bg-[var(--warn-bg)]" },
  confirmed: { label: "Confirmed", color: "text-[var(--green)]",  bg: "bg-[var(--green-bg)]" },
  cancelled: { label: "Cancelled", color: "text-[var(--muted)]",  bg: "bg-[var(--off)]" },
  completed: { label: "Completed", color: "text-[var(--teal)]",   bg: "bg-[var(--teal-light)]" },
} as const;

export type BookingStatusId = keyof typeof BOOKING_STATUS_CONFIG;
