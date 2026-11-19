import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase";

export const EVIDENCE_BUCKET = "samb-completion-evidence";
export const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_EVIDENCE_FILES = 4;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type StoredEvidencePhoto = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export function validateImageMagicBytes(
  buffer: Buffer,
  mimeType: string
): boolean {
  if (buffer.length < 12) return false;

  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

function sanitizeImageFileName(rawName: string): string {
  const base = path.basename(rawName).trim();
  const sanitized = base
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "")
    .replace(/\.{2,}/g, ".")
    .trim();
  return sanitized.length > 0 ? sanitized : "evidence.jpg";
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim()
  );
}

const globalForEvidence = globalThis as unknown as {
  __sambEvidenceStore?: Map<
    string,
    { buffer: Buffer; mimeType: string; fileName: string }
  >;
};

function getMemoryEvidenceStore() {
  if (!globalForEvidence.__sambEvidenceStore) {
    globalForEvidence.__sambEvidenceStore = new Map();
  }
  return globalForEvidence.__sambEvidenceStore;
}

let bucketChecked = false;
async function ensureEvidenceBucketExists(): Promise<void> {
  if (bucketChecked) return;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === EVIDENCE_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(EVIDENCE_BUCKET, {
        public: false,
        fileSizeLimit: MAX_EVIDENCE_FILE_SIZE,
        allowedMimeTypes: Array.from(ALLOWED_IMAGE_MIME_TYPES),
      });
    }
    bucketChecked = true;
  } catch (error) {
    console.warn("Could not verify evidence bucket:", error);
  }
}

export async function uploadEvidencePhoto(
  buffer: Buffer,
  originalName: string,
  declaredMimeType: string,
  bookingId: string
): Promise<StoredEvidencePhoto> {
  if (buffer.length > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error("Each photo must be 5 MB or smaller.");
  }

  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Photos must be JPEG, PNG, or WebP images.");
  }

  let mimeType = declaredMimeType;
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else throw new Error("Unsupported image format.");
  }

  if (!validateImageMagicBytes(buffer, mimeType)) {
    throw new Error("Uploaded file does not match a valid image header.");
  }

  const safeName = sanitizeImageFileName(originalName);
  const storagePath = `bookings/${bookingId}/${randomUUID()}${ext}`;

  if (!isSupabaseConfigured()) {
    getMemoryEvidenceStore().set(storagePath, {
      buffer,
      mimeType,
      fileName: safeName,
    });
    return {
      storagePath,
      fileName: safeName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  await ensureEvidenceBucketExists();
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from(EVIDENCE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Evidence photo upload failed:", error);
    throw new Error("Failed to store completion photo.");
  }

  return {
    storagePath,
    fileName: safeName,
    mimeType,
    fileSize: buffer.length,
  };
}

export async function deleteEvidencePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  if (!isSupabaseConfigured()) {
    const store = getMemoryEvidenceStore();
    for (const p of paths) store.delete(p);
    return;
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.storage.from(EVIDENCE_BUCKET).remove(paths);
  } catch (error) {
    console.error("Failed to cleanup evidence photos:", error);
  }
}

export async function getEvidencePhotoBytes(storagePath: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  fileName: string;
} | null> {
  if (!isSupabaseConfigured()) {
    return getMemoryEvidenceStore().get(storagePath) ?? null;
  }
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .download(storagePath);
    if (error || !data) return null;
    const arrayBuf = await data.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuf),
      mimeType: data.type || "image/jpeg",
      fileName: path.basename(storagePath),
    };
  } catch (error) {
    console.error("Failed to download evidence photo:", error);
    return null;
  }
}
