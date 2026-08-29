"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, X, ShoppingCart, Lock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils/format";
import { ProductArt } from "@/components/shop/ProductArt";
import { countryOptions } from "@/lib/config/countries";
import { MAX_ITEM_QUANTITY } from "@/lib/config/products";
import {
  clearCart,
  removeFromCart,
  setCartQuantity,
  useCart,
  type CartLine,
} from "@/lib/shop/cart";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  category: string;
  stock: number | null;
  sellerName: string | null;
};

type Shipping = {
  email: string;
  shippingName: string;
  shippingLine1: string;
  shippingPostalCode: string;
  shippingCity: string;
  shippingCountry: string;
  shippingPhone: string;
  notes: string;
};

const EMPTY: Shipping = {
  email: "",
  shippingName: "",
  shippingLine1: "",
  shippingPostalCode: "",
  shippingCity: "",
  shippingCountry: "",
  shippingPhone: "",
  notes: "",
};

/**
 * Buy without an account: cart review and the whole address form on one page.
 *
 * One page and no account is the entire point — every extra step here is a
 * shopper who leaves. Prices are re-fetched from the server rather than read
 * from the cart, so what is shown is always what will be charged.
 */
export default function GuestCheckout({ locale }: { locale: string }) {
  const t = useTranslations("public");
  const router = useRouter();
  const cart = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [form, setForm] = useState<Shipping>(EMPTY);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const countries = useMemo(() => countryOptions(locale), [locale]);

  // Re-price whenever the set of products in the cart changes. Quantity changes
  // alone don't need a round trip.
  const idKey = cart
    .map((l) => l.productId)
    .sort()
    .join(",");
  useEffect(() => {
    let cancelled = false;
    if (!idKey) {
      setProducts([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/products?ids=${encodeURIComponent(idKey)}`);
        const json = await res.json();
        if (!cancelled) setProducts(json.success ? (json.data as Product[]) : []);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idKey]);

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  /** Cart lines whose product is still on sale — the only ones that can be bought. */
  const lines: { line: CartLine; product: Product }[] = cart.flatMap((line) => {
    const product = byId.get(line.productId);
    return product ? [{ line, product }] : [];
  });

  /** Lines the server no longer knows about: delisted, deleted, or sold out
   *  since they were added. Shown and skipped, never silently charged. */
  const droppedCount = products === null ? 0 : cart.length - lines.length;

  const total = lines.reduce((s, { line, product }) => s + product.priceCents * line.quantity, 0);

  const ready =
    lines.length > 0 &&
    /.+@.+\..+/.test(form.email.trim()) &&
    form.shippingName.trim() &&
    form.shippingLine1.trim() &&
    form.shippingPostalCode.trim() &&
    form.shippingCity.trim() &&
    form.shippingCountry.length === 2;

  const set = (patch: Partial<Shipping>) => setForm((f) => ({ ...f, ...patch }));

  async function placeOrder() {
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          locale,
          shippingName: form.shippingName.trim(),
          shippingLine1: form.shippingLine1.trim(),
          shippingPostalCode: form.shippingPostalCode.trim(),
          shippingCity: form.shippingCity.trim(),
          shippingCountry: form.shippingCountry,
          shippingPhone: form.shippingPhone.trim() || null,
          notes: form.notes.trim() || undefined,
          items: lines.map(({ line }) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || t("checkoutError"));
        setPlacing(false);
        return;
      }

      // The order exists now, so the cart has done its job. Clearing before we
      // navigate means a back-button press can't place it a second time.
      clearCart();

      if (json.data.checkoutUrl) {
        // Stripe is off-origin, so the Next router can't take us there.
        window.location.assign(json.data.checkoutUrl);
        return;
      }
      router.push(`/${locale}/shop/order/${json.data.orderToken}`);
    } catch {
      setError(t("checkoutError"));
      setPlacing(false);
    }
  }

  /* ── Empty ───────────────────────────────────────────────────────────── */

  // `placing` stays true through the redirect: clearing the cart on success
  // would otherwise flash "your cart is empty" at someone who just bought
  // something, which reads as the order having been lost.
  if (cart.length === 0 && !placing) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-12 h-12 text-[var(--faint)] mx-auto mb-4" />
        <p className="font-semibold text-[var(--ink)] mb-1">{t("cartEmpty")}</p>
        <p className="text-sm text-[var(--muted)] mb-6">{t("cartEmptyDesc")}</p>
        <Link href={`/${locale}/shop`} className="btn-primary">
          {t("cartKeepShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* ── Cart ──────────────────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="font-semibold text-[var(--ink)] mb-4">{t("cartTitle")}</h2>

        {products === null ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" />
          </div>
        ) : (
          <>
            {droppedCount > 0 && (
              <p className="alert-error text-sm mb-4">
                {t("cartUnavailable", { count: droppedCount })}
              </p>
            )}

            <ul className="divide-y divide-[var(--border)]">
              {lines.map(({ line, product }) => {
                const ceiling = Math.min(product.stock ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY);
                return (
                  <li key={product.id} className="py-4 flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--off)] overflow-hidden flex-shrink-0">
                      <ProductArt
                        imageUrl={product.imageUrl}
                        alt={product.name}
                        category={product.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/shop/${product.id}`}
                        className="text-sm font-medium text-[var(--ink)] no-underline hover:text-[var(--accent)]"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {t("cartEach", { price: formatPrice(product.priceCents) })}
                      </p>

                      <div className="flex items-center gap-1 mt-2">
                        <button
                          type="button"
                          aria-label={t("cartDecrease")}
                          onClick={() => setCartQuantity(product.id, line.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t("cartIncrease")}
                          disabled={line.quantity >= ceiling}
                          onClick={() => setCartQuantity(product.id, line.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("cartRemove")}
                          onClick={() => removeFromCart(product.id)}
                          className="ms-2 p-2 text-[var(--muted)] hover:text-[var(--danger-text)] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-[var(--ink)] flex-shrink-0">
                      {formatPrice(product.priceCents * line.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-2">
              <span className="text-sm text-[var(--muted)]">{t("cartTotal")}</span>
              <span className="text-xl font-bold text-[var(--ink)]">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Details ───────────────────────────────────────────────────── */}
      <form
        className="card p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !placing) placeOrder();
        }}
      >
        <div>
          <h2 className="font-semibold text-[var(--ink)]">{t("checkoutContactTitle")}</h2>
          <p className="text-xs text-[var(--muted)] mt-1">{t("checkoutEmailHelp")}</p>
        </div>

        <input
          type="email"
          required
          autoComplete="email"
          className="form-input"
          placeholder={t("checkoutEmail")}
          aria-label={t("checkoutEmail")}
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />

        <h2 className="font-semibold text-[var(--ink)] pt-2">{t("checkoutDeliveryTitle")}</h2>

        <input
          required
          autoComplete="name"
          className="form-input"
          placeholder={t("checkoutName")}
          aria-label={t("checkoutName")}
          value={form.shippingName}
          onChange={(e) => set({ shippingName: e.target.value })}
        />
        <input
          required
          autoComplete="street-address"
          className="form-input"
          placeholder={t("checkoutAddress")}
          aria-label={t("checkoutAddress")}
          value={form.shippingLine1}
          onChange={(e) => set({ shippingLine1: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            required
            autoComplete="postal-code"
            className="form-input"
            placeholder={t("checkoutPostal")}
            aria-label={t("checkoutPostal")}
            value={form.shippingPostalCode}
            onChange={(e) => set({ shippingPostalCode: e.target.value })}
          />
          <input
            required
            autoComplete="address-level2"
            className="form-input col-span-2"
            placeholder={t("checkoutCity")}
            aria-label={t("checkoutCity")}
            value={form.shippingCity}
            onChange={(e) => set({ shippingCity: e.target.value })}
          />
        </div>
        <select
          required
          autoComplete="country"
          className="form-input"
          aria-label={t("checkoutCountry")}
          value={form.shippingCountry}
          onChange={(e) => set({ shippingCountry: e.target.value })}
        >
          <option value="">{t("checkoutCountry")}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          autoComplete="tel"
          className="form-input"
          placeholder={t("checkoutPhone")}
          aria-label={t("checkoutPhone")}
          value={form.shippingPhone}
          onChange={(e) => set({ shippingPhone: e.target.value })}
        />
        <textarea
          className="form-input min-h-[64px] resize-none"
          placeholder={t("checkoutNotes")}
          aria-label={t("checkoutNotes")}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />

        {error && <p className="alert-error text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!ready || placing}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {placing ? t("checkoutPlacing") : t("checkoutPlace", { total: formatPrice(total) })}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted)]">
          <Lock className="w-3 h-3" />
          {t("checkoutNoAccount")}
        </p>

        <p className="text-center text-xs text-[var(--muted)]">
          {t("checkoutHaveAccount")}{" "}
          <Link href="/login?returnTo=/portal/shop" className="text-[var(--teal)] no-underline">
            {t("signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
