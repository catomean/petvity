import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

// Local-disk file storage (replaces @vercel/blob on the self-hosted box).
// Files land in UPLOADS_DIR (Caddy serves them under /uploads/*); the
// returned URL is root-relative so it works behind any domain.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

function safeKey(key: string): string {
  const clean = path.posix.normalize(key).replace(/^(\.\.\/?)+/, "").replace(/^\/+/, "");
  if (clean.includes("..")) throw new Error("invalid storage key");
  return clean;
}

export async function putLocal(key: string, file: File | Buffer): Promise<{ url: string }> {
  const k = safeKey(key);
  const dest = path.join(UPLOADS_DIR, k);
  await mkdir(path.dirname(dest), { recursive: true });
  const data = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
  await writeFile(dest, data);
  return { url: `/uploads/${k}` };
}

export async function delLocal(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const k = safeKey(url.slice("/uploads/".length));
  await unlink(path.join(UPLOADS_DIR, k)).catch(() => {});
}
