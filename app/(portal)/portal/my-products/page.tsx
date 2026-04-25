"use client";

import { useState, useEffect } from "react";
import { Store, Plus, Pencil, X, Package, Eye, EyeOff } from "lucide-react";
import { PRODUCT_CATEGORY_OPTIONS, productCategoryLabel } from "@/lib/config/products";
import { formatPrice } from "@/lib/utils/format";

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
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products?mine=true")
      .then((r) => r.json())
      .then(({ data }) => { setItems(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
    if (!priceCents || priceCents <= 0) { setError("Enter a valid price."); setSaving(false); return; }

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

    if (!data.success) { setError(data.error ?? "Failed to save."); return; }

    if (isEdit) {
      setItems((prev) => prev.map((p) => p.id === editingId ? data.data : p));
    } else {
      setItems((prev) => [data.data, ...prev]);
    }
    closeForm();
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const data = await res.json();
    if (data.success) setItems((prev) => prev.map((x) => x.id === p.id ? data.data : x));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) setItems((prev) => prev.filter((p) => p.id !== id));
  }

  const activeCount = items.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">My Products</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            List items for sale in the Petvity marketplace.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Total listings</p>
            <p className="text-2xl font-bold text-[var(--ink)] mt-1">{items.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-[var(--teal)] mt-1">{activeCount}</p>
          </div>
          <div className="card p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Hidden</p>
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
                {editingId ? "Edit product" : "New product"}
              </h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-[var(--off)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Product name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Premium dog treats"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Description</label>
                <textarea
                  className="form-input min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your product…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Price ($) *</label>
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
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Stock</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="Leave blank = unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Category</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {PRODUCT_CATEGORY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Image URL</label>
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
                <button type="button" onClick={closeForm} className="btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving…" : editingId ? "Save changes" : "List product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="card p-8 text-center text-[var(--muted)]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Store className="w-10 h-10 text-[var(--faint)] mx-auto mb-3" />
          <p className="font-medium text-[var(--ink)]">No products listed yet</p>
          <p className="text-sm text-[var(--muted)] mt-1 mb-5">
            List your pet products, accessories, or supplies in the marketplace.
          </p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> List your first product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className={`card p-4 flex items-center gap-4 ${!p.isActive ? "opacity-60" : ""}`}>
              {/* Icon placeholder */}
              <div className="w-12 h-12 rounded-xl bg-[var(--off)] flex items-center justify-center flex-shrink-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-[var(--muted)]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--ink)] truncate">{p.name}</p>
                  {!p.isActive && (
                    <span className="text-xs bg-[var(--off)] text-[var(--muted)] px-2 py-0.5 rounded-full">Hidden</span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {productCategoryLabel(p.category)} · {formatPrice(p.priceCents)}
                  {p.stock != null && ` · ${p.stock} in stock`}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => toggleActive(p)}
                  title={p.isActive ? "Hide from marketplace" : "Show in marketplace"}
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
