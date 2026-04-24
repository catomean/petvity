"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Package, ShoppingBag, X } from "lucide-react";
import { productCategoryLabel } from "@/lib/config/products";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string;
  stock: number | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ─── Cart ───────────────────────────────────────────────────────────────── */

function CartDrawer({
  cart,
  onClose,
  onQty,
  onRemove,
  onPlace,
  placing,
  notes,
  onNotes,
  success,
  error,
}: {
  cart: CartItem[];
  onClose: () => void;
  onQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlace: () => void;
  placing: boolean;
  notes: string;
  onNotes: (v: string) => void;
  success: boolean;
  error: string;
}) {
  const total = cart.reduce((s, i) => s + i.product.priceCents * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--ink)]">Cart ({cart.length})</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--green-bg)] flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-[var(--green-text)]" />
            </div>
            <p className="font-semibold text-[var(--ink)] mb-1">Order placed!</p>
            <p className="text-sm text-[var(--muted)] mb-5">
              We&apos;ll confirm your order shortly.
            </p>
            <Link href="/portal/orders" onClick={onClose} className="btn-primary">
              View orders
            </Link>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingCart className="w-12 h-12 text-[var(--faint)] mb-3" />
            <p className="text-sm text-[var(--muted)]">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--off)] flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--faint)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] leading-snug">{product.name}</p>
                    <p className="text-xs text-[var(--muted)]">{formatPrice(product.priceCents)} each</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onQty(product.id, -1)}
                      className="w-6 h-6 rounded-full border border-[var(--border)] flex items-center justify-center hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => onQty(product.id, +1)}
                      className="w-6 h-6 rounded-full border border-[var(--border)] flex items-center justify-center hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="ms-1 p-1 hover:text-[var(--danger-text)] text-[var(--muted)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-[var(--border)] space-y-3">
              <textarea
                className="form-input min-h-[60px] resize-none text-sm"
                placeholder="Order notes (optional)"
                value={notes}
                onChange={(e) => onNotes(e.target.value)}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--muted)]">Total</span>
                <span className="font-semibold text-[var(--ink)]">{formatPrice(total)}</span>
              </div>
              {error && <p className="alert-error text-sm">{error}</p>}
              <button
                onClick={onPlace}
                disabled={placing}
                className="btn-primary w-full disabled:opacity-60"
              >
                {placing ? "Placing order…" : "Place order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = activeCategory === "all"
    ? products
    : products.filter((p) => p.category === activeCategory);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function adjustQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  async function placeOrder() {
    setError("");
    setPlacing(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        notes: notes.trim() || undefined,
      }),
    });
    const data = await res.json();
    setPlacing(false);
    if (data.success) {
      setCart([]);
      setNotes("");
      setSuccess(true);
    } else {
      setError(data.error ?? "Failed to place order.");
    }
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Shop</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">Pet food, toys, health products and more</p>
        </div>
        <button
          onClick={() => { setSuccess(false); setCartOpen(true); }}
          className="relative btn-outline flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Category filter */}
      {!loading && products.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "border-[var(--border)] text-[var(--ink2)] hover:border-[var(--teal)] hover:text-[var(--teal)]"
              }`}
            >
              {cat === "all" ? "All" : productCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-56 animate-pulse bg-[var(--off)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-[var(--teal)]" />
          </div>
          <p className="font-medium text-[var(--ink)] mb-2">No products yet</p>
          <p className="text-sm text-[var(--muted)] mb-5 max-w-xs mx-auto">
            The marketplace is being stocked. In the meantime, check your pet&apos;s health dashboard or find a vet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/portal/dashboard" className="btn-primary text-sm">Go to dashboard</Link>
            <Link href="/portal/find" className="btn-outline text-sm">Find a vet or sitter</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id);
            const outOfStock = product.stock !== null && product.stock === 0;
            return (
              <div key={product.id} className="card overflow-hidden flex flex-col">
                <div className="h-36 bg-[var(--off)] flex items-center justify-center">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-[var(--faint)]" />
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <span className="text-xs text-[var(--muted)] mb-0.5">
                    {productCategoryLabel(product.category)}
                  </span>
                  <p className="font-medium text-[var(--ink)] text-sm leading-snug mb-1 flex-1">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="font-semibold text-[var(--accent)]">
                      {formatPrice(product.priceCents)}
                    </span>
                    {outOfStock ? (
                      <span className="text-xs text-[var(--muted)]">Out of stock</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustQty(product.id, -1)}
                          className="w-6 h-6 rounded-full bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{inCart.quantity}</span>
                        <button
                          onClick={() => adjustQty(product.id, +1)}
                          className="w-6 h-6 rounded-full bg-[var(--teal-light)] text-[var(--teal)] flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="text-xs px-2 py-1 rounded-lg bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)] transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                  {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
                    <p className="text-xs text-[var(--warn-text)] mt-1">Only {product.stock} left</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => { setCartOpen(false); setError(""); }}
          onQty={adjustQty}
          onRemove={removeFromCart}
          onPlace={placeOrder}
          placing={placing}
          notes={notes}
          onNotes={setNotes}
          success={success}
          error={error}
        />
      )}
    </div>
  );
}
