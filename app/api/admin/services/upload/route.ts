import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { validateImageMagicBytes } from "@/lib/evidence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SERVICE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function POST(request: Request) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return apiError(400, "MISSING_FILE", "Please select an image file to upload.");
    }

    if (file.size > MAX_SERVICE_IMAGE_SIZE) {
      return apiError(413, "FILE_TOO_LARGE", "Image file must be under 10 MB.");
    }

    const originalName = file instanceof File ? file.name : "upload.jpg";
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return apiError(
        415,
        "UNSUPPORTED_FORMAT",
        "Only JPG, PNG, and WebP image files are allowed."
      );
    }

    const declaredMime = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
      return apiError(
        415,
        "UNSUPPORTED_MIME",
        "Invalid image MIME type. Please upload a standard JPG, PNG, or WebP image."
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateImageMagicBytes(buffer, declaredMime)) {
      return apiError(
        422,
        "INVALID_IMAGE_BYTES",
        "The uploaded file does not match a valid image signature."
      );
    }

    const safeExtension = ext === ".jpeg" ? ".jpg" : ext;
    const fileName = `service-${Date.now()}-${randomUUID().slice(0, 8)}${safeExtension}`;
    const uploadDir = path.join(process.cwd(), "public", "images", "services", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    const publicUrl = `/images/services/uploads/${fileName}`;

    return apiSuccess("Image uploaded successfully.", {
      url: publicUrl,
      fileName,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Service image upload error:", error);
    return apiError(
      500,
      "UPLOAD_FAILED",
      "Unable to upload image at this time. Please try again."
    );
  }
}
