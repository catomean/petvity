"use client";

/**
 * Shared hook for the three health CRUD pages (medications, vaccinations, records).
 *
 * All three pages have identical state management: fetch, filter/search, add/edit/delete
 * modal, optimistic row updates, and router refresh. Only the form fields, API path, and
 * filter predicate differ — those are passed as callbacks so each page stays declarative.
 *
 * TRow  — the entity row type (must have at least `id: string`)
 * TForm — the form state type (must be all-string values so `field()` stays type-safe)
 */

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface UseHealthListOptions<
  TRow extends { id: string },
  TForm extends object,
> {
  petId: string;
  /** Collection + item base path. POST goes to `apiPath`, PATCH/DELETE to `apiPath/${id}`. */
  apiPath: string;
  emptyForm: TForm;
  /** Maps a row (for editing) back to form state. */
  rowToForm: (row: TRow) => TForm;
  /** Builds the JSON body for POST (isEdit=false) and PATCH (isEdit=true). */
  buildBody: (form: TForm, petId: string, isEdit: boolean) => Record<string, unknown>;
  /**
   * Returns true when a row should be shown given the current filter string and
   * lower-cased search query. Called only when filter !== "all" OR query is non-empty.
   */
  matchesFilterAndSearch: (row: TRow, filter: string, searchQuery: string) => boolean;
}

export function useHealthList<
  TRow extends { id: string },
  TForm extends object,
>({
  petId,
  apiPath,
  emptyForm,
  rowToForm,
  buildBody,
  matchesFilterAndSearch,
}: UseHealthListOptions<TRow, TForm>) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [petName, setPetName]   = useState("");
  const [rows, setRows]         = useState<TRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [searchQ, setSearchQ]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm]   = useState<TForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [petRes, dataRes] = await Promise.all([
        fetch(`/api/pets/${petId}`),
        fetch(`${apiPath}?petId=${petId}`),
      ]);
      if (cancelled) return;
      if (petRes.ok)  setPetName((await petRes.json()).data?.name ?? "");
      if (dataRes.ok) setRows((await dataRes.json()).data ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [petId, apiPath]);

  function openAdd() {
    setEditingId(null);
    setDeletingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(row: TRow) {
    setEditingId(row.id);
    setDeletingId(null);
    setForm(rowToForm(row));
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const isEdit = editingId !== null;
    const url    = isEdit ? `${apiPath}/${editingId}` : apiPath;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(form, petId, isEdit)),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) { setError(data.error ?? "Failed to save."); return; }

    if (isEdit) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? (data.data as TRow) : r)));
    } else {
      setRows((prev) => [data.data as TRow, ...prev]);
    }
    closeForm();
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
      startTransition(() => router.refresh());
    }
  }

  /** Update a single form field. All FormState values are strings, so this is type-safe. */
  function field(key: keyof TForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const filteredRows =
    filter !== "all" || searchQ.trim()
      ? rows.filter((r) => matchesFilterAndSearch(r, filter, searchQ.toLowerCase()))
      : rows;

  return {
    // Data
    petName, rows, loading, filteredRows,
    // Filter / search
    filter, setFilter, searchQ, setSearchQ,
    // Modal state
    showForm, editingId, deletingId, setDeletingId,
    // Form state
    form, saving, error,
    // Actions
    openAdd, openEdit, closeForm, handleSubmit, handleDelete, field,
  };
}
