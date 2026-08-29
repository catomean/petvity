"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { ProductArt } from "@/components/shop/ProductArt";
import { IMAGE_ACCEPT_ATTR, IMAGE_MAX_BYTES, IMAGE_MAX_MB } from "@/lib/config/uploads";

/**
 * Pick a product photo from disk.
 *
 * Replaces the "paste an image URL" input, which quietly required the seller to
 * already host the picture somewhere — so listing a real product meant finding
 * an image host first. Everyone who sells has photos on their phone; nobody has
 * a CDN.
 *
 * The upload is independent of the product row (see
 * /api/uploads/product-image), so this works identically when creating and when
 * editing. The parent stores only the returned URL.
 *
 * Labels default to English for the admin area, which is not localised; the
 * portal passes translated ones.
 */

type Labels = {
  title: string;
  hint: string;
  upload: string;
  change: string;
  remove: string;
  tooLarge: string;
  failed: string;
};

const DEFAULT_LABELS: Labels = {
  title: "Product photo",
  hint: `JPEG, PNG, WebP or GIF, up to ${IMAGE_MAX_MB} MB.`,
  upload: "Upload photo",
  change: "Change photo",
  remove: "Remove",
  tooLarge: `That image is too large (max ${IMAGE_MAX_MB} MB).`,
  failed: "Upload failed. Please try again.",
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  category: string;
  name?: string;
  labels?: Partial<Labels>;
};

export function ProductImageField({ value, onChange, category, name, labels }: Props) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be re-picked after a failure.
    e.target.value = "";
    if (!file) return;

    setError("");
    // Check before uploading: a 20 MB photo over a phone connection would
    // otherwise upload in full only to be rejected on arrival.
    if (file.size > IMAGE_MAX_BYTES) {
      setError(l.tooLarge);
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads/product-image", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error ?? l.failed);
        return;
      }
      onChange(data.data.url);
    } catch {
      setError(l.failed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink2)] mb-1">{l.title}</label>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-[var(--off)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
            <ProductArt
              imageUrl={value || null}
              alt={name || l.title}
              category={category}
              className={value ? "w-full h-full object-cover" : "w-12 h-12"}
            />
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[var(--teal)] animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--muted)] mb-2">{l.hint}</p>
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT_ATTR}
            className="sr-only"
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-outline text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5" />
              {value ? l.change : l.upload}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setError("");
                }}
                className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {l.remove}
              </button>
            )}
          </div>
          {error && <p className="text-xs text-[var(--danger-text)] mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
