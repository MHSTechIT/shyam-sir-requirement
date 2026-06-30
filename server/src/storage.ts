import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// File storage abstraction.
//
// Default: local disk (UPLOAD_DIR). Good for local dev and single-server
// deployments that mount a persistent disk (e.g. a Render disk).
//
// To use S3/R2 instead for multi-instance hosting, implement the same three
// functions with @aws-sdk/client-s3 and switch on an env flag — the rest of the
// app only depends on this interface.
// ─────────────────────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

function ensureDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** Persist bytes and return an opaque storage key. */
export function saveFile(originalName: string, buffer: Buffer): string {
  ensureDir();
  const ext = path.extname(originalName);
  const key = `${Date.now().toString(36)}_${crypto.randomBytes(6).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer);
  return key;
}

/** Absolute path for streaming a stored file back to the client. */
export function resolveFile(storageKey: string): string {
  return path.join(UPLOAD_DIR, storageKey);
}

export function deleteFile(storageKey: string): void {
  try {
    const p = path.join(UPLOAD_DIR, storageKey);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* best-effort cleanup */
  }
}
