"use client";

import { Plus, Minus, Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { addToCart, setCartQuantity, useCart } from "@/lib/shop/cart";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";

/**
 * The one control that puts something in the guest cart.
 *
 * Once an item is in the cart it turns into a stepper in place, so the shopper
 * never has to open a drawer to find out whether the click worked or to buy a
 * second one.
 */
export default function AddToCartButton({
  productId,
  outOfStock = false,
  stock = null,
  size = "md",
}: {
  productId: string;
  outOfStock?: boolean;
  /** Finite stock caps the stepper; null means unlimited. */
  stock?: number | null;
  size?: "sm" | "md";
}) {
  const t = useTranslations("public");
  const cart = useCart();
  const line = cart.find((l) => l.productId === productId);

  if (outOfStock) {
    return (
      <span className={size === "sm" ? "badge badge-neutral" : "btn-outline opacity-60"}>
        {t("shopOutOfStock")}
      </span>
    );
  }

  const ceiling = Math.min(stock ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY);

  if (!line) {
    return (
      <button
        type="button"
        onClick={() => addToCart(productId)}
        className={size === "sm" ? "btn-primary btn-primary-sm" : "btn-primary"}
      >
        <ShoppingCart className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {t("cartAdd")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t("cartDecrease")}
          onClick={() => setCartQuantity(productId, line.quantity - 1)}
          className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-7 text-center text-sm font-semibold text-[var(--ink)]">
          {line.quantity}
        </span>
        <button
          type="button"
          aria-label={t("cartIncrease")}
          disabled={line.quantity >= ceiling}
          onClick={() => setCartQuantity(productId, line.quantity + 1)}
          className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors disabled:opacity-40 disabled:hover:border-[var(--border)] disabled:hover:text-[var(--ink2)]"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--green-text)]">
        <Check className="w-3.5 h-3.5" />
        {t("cartInCart")}
      </span>
    </div>
  );
}
