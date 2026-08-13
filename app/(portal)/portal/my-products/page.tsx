"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Plus, Pencil, X, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/config/products";
import { ProductArt } from "@/components/shop/ProductArt";
import { formatPrice } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  category: string;
  stock: number | null;
  isActive: boolean;
}

interface FormState {
  name: string;
  description: string;
  priceDollars: string;
  imageUrl: string;
  category: string;
  stock: string;
}

const EMPTY_FORM: FormState = {
  name: "", description: "", priceDollars: "", imageUrl: "", category: "other", stock: "",
};

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function MyProductsPage() {
  const t = useTranslations("portal");
  const tPub = useTranslations("public");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mutationError, setMutationError] = useState("");

  function loadItems() {
    setLoading(true);
    setFetchError("");
    fetch("/api/products?mine=true")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ data }) => { setItems(data ?? []); setLoading(false); })
      .catch(() => { setFetchError(t("loadFailed")); setLoading(false); });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadItems(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      priceDollars: (p.priceCents / 100).toFixed(2),
      imageUrl: p.imageUrl ?? "",
      category: p.category,
      stock: p.stock != null ? String(p.stock) : "",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const priceCents = Math.round(parseFloat(form.priceDollars) * 100);
    if (!priceCents || priceCents <= 0) { setError(t("myProductsInvalidPrice")); setSaving(false); return; }

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      priceCents,
      imageUrl: form.imageUrl.trim() || null,
      category: form.category,
      stock: form.stock !== "" ? parseInt(form.stock) : null,
    };

    const isEdit = editingId !== null;
    const url = isEdit ? `/api/products/${editingId}` : "/api/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (!data.success) { setError(data.error ?? t("myProductsSaveFailed")); return; }

    if (isEdit) {
      setItems((prev) => prev.map((p) => p.id === editingId ? data.data : p));
    } else {
      setItems((prev) => [data.data, ...prev]);
    }
    closeForm();
  }

  async function toggleActive(p: Product) {
    setMutationError("");
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const data = await res.json();
    if (data.success) setItems((prev) => prev.map((x) => x.id === p.id ? data.data : x));
    else setMutationError(data.error ?? t("saveFailed"));
  }

  async function handleDelete(id: string) {
    setMutationError("");
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) setItems((prev) => prev.filter((p) => p.id !== id));
    else setMutationError(data.error ?? t("deleteFailed"));
  }

  const activeCount = items.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t("myProductsTitle")}</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">{t("myProductsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/portal/my-products/orders" className="btn-outline flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> {t("orders")}
          </Link>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t("myProductsAdd")}
          </button>
        </div>
      </div>

      {mutationError && <p className="alert-error">{mutationError}</p>}

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">{t("myProductsTotalListings")}</p>
            <p className="text-2xl font-bold text-[var(--ink)] mt-1">{items.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">{t("myProductsActive")}</p>
            <p className="text-2xl font-bold text-[var(--teal)] mt-1">{activeCount}</p>
          </div>
          <div className="card p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">{t("myProductsHidden")}</p>
            <p className="text-2xl font-bold text-[var(--ink2)] mt-1">{items.length - activeCount}</p>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--ink)]">
                {editingId ? t("myProductsEditTitle") : t("myProductsNewTitle")}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-[var(--off)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsNameLabel")} *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("myProductsNamePlaceholder")}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsDescLabel")}</label>
                <textarea
                  className="form-input min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("myProductsDescPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsPriceLabel")} *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.priceDollars}
                    onChange={(e) => setForm((f) => ({ ...f, priceDollars: e.target.value }))}
                    placeholder="19.99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsStockLabel")}</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder={t("myProductsStockPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsCategoryLabel")}</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {PRODUCT_CATEGORY_OPTIONS.map(({ value }) => (
                    <option key={value} value={value}>{tPub(`cat_${value}` as Parameters<typeof tPub>[0])}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{t("myProductsImageUrl")}</label>
                <input
                  className="form-input"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </div>

              {error && <p className="alert-error">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-outline">{t("cancel")}</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? t("saving") : editingId ? t("editPetSave") : t("myProductsList")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="card p-8 text-center text-[var(--muted)]">{t("editPetLoading")}</div>
      ) : fetchError ? (
        <div className="card py-12 text-center">
          <p className="text-[var(--danger-text)] font-medium mb-3">{fetchError}</p>
          <button onClick={loadItems} className="btn-outline text-sm">
            {t("retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-10 h-10 text-[var(--faint)] mx-auto mb-3" />
          <p className="font-medium text-[var(--ink)]">{t("myProductsEmpty")}</p>
          <p className="text-sm text-[var(--muted)] mt-1 mb-5">{t("myProductsEmptyDesc")}</p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t("myProductsListFirst")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className={`card p-4 flex items-center gap-4 ${!p.isActive ? "opacity-60" : ""}`}>
              {/* Icon placeholder */}
              <div className="w-12 h-12 rounded-xl bg-[var(--off)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <ProductArt
                  imageUrl={p.imageUrl}
                  alt={p.name}
                  category={p.category}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--ink)] truncate">{p.name}</p>
                  {!p.isActive && (
                    <span className="text-xs bg-[var(--off)] text-[var(--muted)] px-2 py-0.5 rounded-full">{t("myProductsHidden")}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {tPub(`cat_${p.category}` as Parameters<typeof tPub>[0])} · {formatPrice(p.priceCents)}
                  {p.stock != null && ` · ${t("myProductsInStock", { count: p.stock })}`}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(p)}
                  title={p.isActive ? t("myProductsHideTitle") : t("myProductsShowTitle")}
                  className="p-2 rounded-lg hover:bg-[var(--off)] transition-colors text-[var(--muted)]"
                >
                  {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-[var(--off)] transition-colors text-[var(--muted)]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 rounded-lg hover:bg-[var(--danger-bg)] transition-colors text-[var(--muted)] hover:text-[var(--danger-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
