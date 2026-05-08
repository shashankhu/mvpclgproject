// ─────────────────────────────────────────────
// POST /api/upload — Secure file upload endpoint
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { unauthorized, error, success } from "@/lib/api";
import { saveFile, UPLOAD_CONTEXTS, UPLOAD_CONFIG } from "@/lib/upload";

export async function POST(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const formData = await request.formData();
    const files = formData.getAll("files");
    const context = formData.get("context") || "general";

    // Validate context
    if (!UPLOAD_CONTEXTS.includes(context)) {
      return error(`Invalid upload context: "${context}". Must be one of: ${UPLOAD_CONTEXTS.join(", ")}`);
    }

    // Validate file count
    if (!files || files.length === 0) {
      return error("No files provided");
    }
    if (files.length > UPLOAD_CONFIG.MAX_FILES_PER_UPLOAD) {
      return error(`Maximum ${UPLOAD_CONFIG.MAX_FILES_PER_UPLOAD} files allowed per upload`);
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        errors.push({ fileName: "unknown", error: "Invalid file object" });
        continue;
      }

      // Save file to disk
      const saveResult = await saveFile(file, context);

      if (!saveResult.success) {
        errors.push({ fileName: file.name, error: saveResult.error });
        continue;
      }

      // Create attachment record in DB
      try {
        const attachment = await prisma.attachment.create({
          data: {
            fileName: saveResult.data.fileName,
            fileUrl: saveResult.data.fileUrl,
            fileSize: saveResult.data.fileSize,
            mimeType: saveResult.data.mimeType,
            uploadedById: decoded.userId,
          },
        });

        results.push({
          id: attachment.id,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
        });
      } catch (dbErr) {
        // Cleanup: delete file from disk if DB insert fails
        const { deleteFile } = await import("@/lib/upload");
        await deleteFile(saveResult.data.fileUrl);
        errors.push({ fileName: file.name, error: "Failed to save file record" });
      }
    }

    return success({
      attachments: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} file(s) uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
    }, results.length > 0 ? 201 : 400);
  } catch (err) {
    console.error("[upload]", err);
    return error("File upload failed", 500);
  }
}
