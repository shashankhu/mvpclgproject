// ─────────────────────────────────────────────
// Diganta — File Upload Utilities
// Handles secure file storage, validation, and cleanup
// ─────────────────────────────────────────────

import { writeFile, mkdir, unlink, stat } from "fs/promises";
import path from "path";

// ─── Configuration ───

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  UPLOAD_DIR: path.join(process.cwd(), "public", "uploads"),
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// Human-readable type labels
export const MIME_TYPE_LABELS = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/webp": "WebP Image",
  "application/msword": "Word Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
};

// Upload contexts for organizing files
export const UPLOAD_CONTEXTS = [
  "vendor-docs",
  "quotations",
  "requirements",
  "events",
  "bills",
  "general",
];

// ─── Validation ───

/**
 * Validates a file's MIME type against allowed types
 * @param {string} mimeType
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileType(mimeType) {
  if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type "${mimeType}" not allowed. Accepted: PDF, JPEG, PNG, WebP, Word documents.`,
    };
  }
  return { valid: true };
}

/**
 * Validates file size
 * @param {number} sizeBytes
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileSize(sizeBytes) {
  if (sizeBytes > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    const maxMB = (UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    const fileMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileMB}MB) exceeds maximum allowed size (${maxMB}MB).`,
    };
  }
  return { valid: true };
}

// ─── File Path Generation ───

/**
 * Sanitize a filename — strip special chars, limit length
 * @param {string} fileName
 * @returns {string}
 */
export function sanitizeFileName(fileName) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
    .replace(/_{2,}/g, "_") // Collapse multiple underscores
    .slice(0, 100); // Limit length
}

/**
 * Generate a unique file path for storage
 * @param {string} context - Upload context (vendor-docs, quotations, etc.)
 * @param {string} originalName - Original filename
 * @returns {{ relativePath: string, absolutePath: string, fileUrl: string }}
 */
export function generateFilePath(context, originalName) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(originalName);
  const uniqueName = `${timestamp}-${sanitized}`;

  const relativePath = path.join(context, yearMonth, uniqueName);
  const absolutePath = path.join(UPLOAD_CONFIG.UPLOAD_DIR, relativePath);
  const fileUrl = `/uploads/${context}/${yearMonth}/${uniqueName}`;

  return { relativePath, absolutePath, fileUrl };
}

// ─── File Operations ───

/**
 * Save a file to disk with full validation
 * @param {File|Blob} file - The uploaded file
 * @param {string} context - Upload context
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function saveFile(file, context = "general") {
  try {
    // Validate context
    if (!UPLOAD_CONTEXTS.includes(context)) {
      return { success: false, error: `Invalid upload context: "${context}"` };
    }

    // Validate MIME type
    const typeCheck = validateFileType(file.type);
    if (!typeCheck.valid) return { success: false, error: typeCheck.error };

    // Validate size
    const sizeCheck = validateFileSize(file.size);
    if (!sizeCheck.valid) return { success: false, error: sizeCheck.error };

    // Generate path
    const { absolutePath, fileUrl } = generateFilePath(context, file.name);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await mkdir(dir, { recursive: true });

    // Read file buffer and write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    // Verify write succeeded (read back file stats)
    const stats = await stat(absolutePath);
    if (stats.size !== buffer.length) {
      // Cleanup corrupted file
      await unlink(absolutePath).catch(() => {});
      return { success: false, error: "File write verification failed — size mismatch" };
    }

    return {
      success: true,
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    };
  } catch (err) {
    console.error("[upload:saveFile]", err);
    return { success: false, error: "Failed to save file to disk" };
  }
}

/**
 * Delete a file from disk
 * @param {string} fileUrl - The URL path (e.g., /uploads/vendor-docs/2026-04/file.pdf)
 * @returns {boolean}
 */
export async function deleteFile(fileUrl) {
  try {
    const absolutePath = path.join(process.cwd(), "public", fileUrl);
    await unlink(absolutePath);
    return true;
  } catch (err) {
    console.error("[upload:deleteFile]", err);
    return false;
  }
}
