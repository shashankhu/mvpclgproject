// ─────────────────────────────────────────────
// GET  /api/quotation-requests/[id]/quotations — All quotations for this request
// POST /api/quotation-requests/[id]/quotations — Submit quotation (vendor only)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { createAuditLog, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    // Only Dean/Admin/Finance can see all quotations
    if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(decoded.role)) {
      return forbidden("Only administrators can view all quotations");
    }

    const quotations = await prisma.quotation.findMany({
      where: { quotationRequestId: id, isLatest: true },
      orderBy: { amount: "asc" },
      include: {
        vendor: {
          select: {
            id: true, companyName: true, contactPerson: true,
            phone: true, email: true, rating: true, totalOrders: true,
            categories: true, gstNumber: true,
          },
        },
        attachments: {
          select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true },
        },
      },
    });

    return success({ quotations });
  } catch (err) {
    console.error("[quotations:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    if (decoded.role !== ROLES.VENDOR) {
      return forbidden("Only vendors can submit quotations");
    }

    const { id: quotationRequestId } = await params;
    const body = await request.json();

    // Validate required fields
    const missing = validateRequired(body, ["amount"]);
    if (missing) return error(missing);

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return error("Amount must be a positive number");
    }
    if (amount > 9999999999.99) {
      return error("Amount exceeds maximum allowed value");
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: decoded.userId },
    });
    if (!vendor) return forbidden("Vendor profile not found");
    if (!vendor.isVerified) return forbidden("Your vendor account is not yet verified");

    // Get quotation request
    const qr = await prisma.quotationRequest.findUnique({ where: { id: quotationRequestId } });
    if (!qr) return notFound("Quotation request not found");

    if (qr.status !== "open") {
      return error("This quotation request is no longer accepting submissions", 409);
    }

    // Check deadline
    if (qr.deadline && new Date(qr.deadline) < new Date()) {
      return error("The deadline for this quotation request has passed", 403);
    }

    // Check category match
    if (!vendor.categories.includes(qr.category)) {
      return error("Your service categories do not match this request");
    }

    // Check if vendor already has a submitted quotation
    const existingQuotation = await prisma.quotation.findFirst({
      where: {
        quotationRequestId,
        vendorId: vendor.id,
        isLatest: true,
        status: "submitted",
      },
    });

    if (existingQuotation) {
      // This is an UPDATE — create new version
      const newVersion = existingQuotation.version + 1;

      const result = await prisma.$transaction(async (tx) => {
        // Mark old quotation as superseded
        await tx.quotation.update({
          where: { id: existingQuotation.id },
          data: { status: "superseded", isLatest: false },
        });

        // Create new version
        const newQuotation = await tx.quotation.create({
          data: {
            quotationRequestId,
            vendorId: vendor.id,
            version: newVersion,
            amount,
            description: body.description || null,
            deliveryTimeline: body.deliveryTimeline || null,
            termsAndConditions: body.termsAndConditions || null,
            validUntil: body.validUntil ? new Date(body.validUntil) : null,
            status: "submitted",
            isLatest: true,
          },
        });

        // Link attachments if provided
        if (body.attachmentIds && body.attachmentIds.length > 0) {
          await tx.attachment.updateMany({
            where: {
              id: { in: body.attachmentIds.slice(0, 5) },
              uploadedById: decoded.userId,
              quotationId: null,
            },
            data: { quotationId: newQuotation.id },
          });
        }

        // Notify the request creator
        await tx.notification.create({
          data: {
            userId: qr.requestedById,
            type: "quotation_updated",
            title: "Quotation Updated",
            message: `${vendor.companyName} updated their quotation for "${qr.title}" (v${newVersion}, ₹${amount.toLocaleString("en-IN")})`,
          },
        });

        // Audit log
        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.QUOTATION_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.QUOTATION,
          entityId: newQuotation.id,
          userId: decoded.userId,
          metadata: {
            vendorId: vendor.id,
            oldAmount: Number(existingQuotation.amount),
            newAmount: amount,
            oldVersion: existingQuotation.version,
            newVersion,
          },
        });

        return newQuotation;
      });

      return success({
        quotation: result,
        message: `Quotation updated to version ${newVersion}`,
      });
    }

    // First submission
    const result = await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationRequestId,
          vendorId: vendor.id,
          version: 1,
          amount,
          description: body.description || null,
          deliveryTimeline: body.deliveryTimeline || null,
          termsAndConditions: body.termsAndConditions || null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          status: "submitted",
          isLatest: true,
        },
      });

      // Link attachments
      if (body.attachmentIds && body.attachmentIds.length > 0) {
        await tx.attachment.updateMany({
          where: {
            id: { in: body.attachmentIds.slice(0, 5) },
            uploadedById: decoded.userId,
            quotationId: null,
          },
          data: { quotationId: quotation.id },
        });
      }

      // Notify the request creator
      await tx.notification.create({
        data: {
          userId: qr.requestedById,
          type: "quotation_received",
          title: "New Quotation Received",
          message: `${vendor.companyName} submitted a quotation for "${qr.title}" — ₹${amount.toLocaleString("en-IN")}`,
        },
      });

      // Audit log
      await createAuditLog(tx, {
        action: AUDIT_ACTIONS.QUOTATION_SUBMITTED,
        entityType: AUDIT_ENTITY_TYPES.QUOTATION,
        entityId: quotation.id,
        userId: decoded.userId,
        metadata: { vendorId: vendor.id, amount, version: 1 },
      });

      return quotation;
    });

    // Budget mismatch warning
    let warning = null;
    if (qr.budgetLimit && amount > Number(qr.budgetLimit)) {
      warning = `Your quotation (₹${amount.toLocaleString("en-IN")}) exceeds the budget limit (₹${Number(qr.budgetLimit).toLocaleString("en-IN")})`;
    }

    return success({
      quotation: result,
      warning,
      message: "Quotation submitted successfully",
    }, 201);
  } catch (err) {
    console.error("[quotations:submit]", err);
    if (err.code === "P2002") {
      return error("You have already submitted a quotation for this request", 409);
    }
    return error("Internal server error", 500);
  }
}
