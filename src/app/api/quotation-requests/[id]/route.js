// ─────────────────────────────────────────────
// GET   /api/quotation-requests/[id] — Detail with quotations
// PATCH /api/quotation-requests/[id] — Award vendor or close request
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { createAuditLog, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const qr = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, status: true, eventDate: true } },
        resourceRequest: {
          select: { id: true, title: true, description: true, category: true, amount: true, quantity: true, priority: true },
        },
        requestedBy: { select: { id: true, name: true, role: true } },
        awardedTo: {
          select: { id: true, companyName: true, contactPerson: true, phone: true, email: true, rating: true, totalOrders: true },
        },
        quotations: {
          where: { isLatest: true },
          orderBy: { amount: "asc" },
          include: {
            vendor: {
              select: { id: true, companyName: true, contactPerson: true, phone: true, rating: true, totalOrders: true, categories: true },
            },
            attachments: { select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true } },
          },
        },
        attachments: { select: { id: true, fileName: true, fileUrl: true, fileSize: true, mimeType: true } },
        vendorBill: {
          include: {
            vendor: { select: { companyName: true } },
          },
        },
      },
    });

    if (!qr) return notFound("Quotation request not found");

    // Access control
    if (decoded.role === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({ where: { userId: decoded.userId } });
      if (!vendor || !vendor.isVerified) return forbidden("Vendor not verified");
      // Vendor can only see if their category matches
      if (!vendor.categories.includes(qr.category)) {
        return forbidden("This request is not in your service categories");
      }
      // For vendor view: only show their own quotation, not others'
      qr.quotations = qr.quotations.filter((q) => q.vendorId === vendor.id);
    } else if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(decoded.role)) {
      return forbidden("You do not have access to this quotation request");
    }

    // Add derived fields
    const isExpired = qr.deadline && new Date(qr.deadline) < new Date() && qr.status === "open";

    return success({
      quotationRequest: {
        ...qr,
        isExpired,
        quotationCount: qr.quotations.length,
      },
    });
  } catch (err) {
    console.error("[quotation-requests:detail]", err);
    return error("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(decoded.role)) {
      return forbidden("Only Dean or Admin can manage quotation requests");
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "award" | "close"

    const qr = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        quotations: { where: { isLatest: true }, include: { vendor: true } },
        event: { select: { id: true, title: true } },
        resourceRequest: { select: { id: true, title: true } },
      },
    });

    if (!qr) return notFound("Quotation request not found");

    if (action === "award") {
      if (qr.status === "awarded") return error("This request is already awarded", 409);
      if (!body.vendorId) return error("vendorId is required for awarding");

      // Find the latest quotation from the selected vendor
      const selectedQuotation = qr.quotations.find(
        (q) => q.vendorId === body.vendorId && q.status === "submitted"
      );
      if (!selectedQuotation) {
        return error("No submitted quotation found from this vendor");
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Update QuotationRequest → awarded
        const updatedQr = await tx.quotationRequest.update({
          where: { id },
          data: {
            status: "awarded",
            awardedToId: body.vendorId,
            awardedAt: new Date(),
            awardComment: body.awardComment || null,
          },
        });

        // 2. Selected quotation → accepted
        await tx.quotation.update({
          where: { id: selectedQuotation.id },
          data: { status: "accepted", reviewedAt: new Date(), reviewComment: body.awardComment || null },
        });

        // 3. All other latest quotations → rejected
        const otherQuotations = qr.quotations.filter(
          (q) => q.id !== selectedQuotation.id && q.status === "submitted"
        );
        for (const oq of otherQuotations) {
          await tx.quotation.update({
            where: { id: oq.id },
            data: { status: "rejected", reviewedAt: new Date() },
          });
        }

        // 4. Auto-create VendorBill for finance
        const billAmount = Number(selectedQuotation.amount);
        const vendorBill = await tx.vendorBill.create({
          data: {
            quotationRequestId: id,
            quotationId: selectedQuotation.id,
            vendorId: body.vendorId,
            eventId: qr.eventId,
            billAmount,
            totalAmount: billAmount,
            paymentStatus: "pending",
          },
        });

        // 5. Update ResourceRequest → fulfilled
        await tx.resourceRequest.update({
          where: { id: qr.resourceRequestId },
          data: { status: "fulfilled" },
        });

        // 6. Notify winning vendor
        await tx.notification.create({
          data: {
            userId: selectedQuotation.vendor.userId,
            type: "vendor_awarded",
            title: "Quotation Accepted!",
            message: `Your quotation for "${qr.title}" has been accepted! Amount: ₹${billAmount.toLocaleString("en-IN")}`,
          },
        });

        // 7. Notify losing vendors
        for (const oq of otherQuotations) {
          await tx.notification.create({
            data: {
              userId: oq.vendor.userId,
              type: "quotation_rejected",
              title: "Quotation Not Selected",
              message: `The quotation request "${qr.title}" has been awarded to another vendor.`,
            },
          });
        }

        // 8. Notify ALL finance users about new bill
        const financeUsers = await tx.user.findMany({
          where: { role: ROLES.FINANCE, isActive: true },
          select: { id: true },
        });
        if (financeUsers.length > 0) {
          await tx.notification.createMany({
            data: financeUsers.map((u) => ({
              userId: u.id,
              type: "bill_created",
              title: "New Vendor Bill",
              message: `New vendor bill: ₹${billAmount.toLocaleString("en-IN")} from ${selectedQuotation.vendor.companyName} for "${qr.event.title}"`,
            })),
          });
        }

        // 9. Audit logs
        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.VENDOR_AWARDED,
          entityType: AUDIT_ENTITY_TYPES.QUOTATION_REQUEST,
          entityId: id,
          userId: decoded.userId,
          metadata: {
            vendorId: body.vendorId,
            companyName: selectedQuotation.vendor.companyName,
            amount: billAmount,
            awardComment: body.awardComment || null,
          },
        });

        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.BILL_CREATED,
          entityType: AUDIT_ENTITY_TYPES.VENDOR_BILL,
          entityId: vendorBill.id,
          userId: decoded.userId,
          metadata: { vendorId: body.vendorId, amount: billAmount },
        });

        // 10. Increment vendor's total orders
        await tx.vendor.update({
          where: { id: body.vendorId },
          data: { totalOrders: { increment: 1 } },
        });

        return { updatedQr, vendorBill };
      });

      return success({
        quotationRequest: result.updatedQr,
        vendorBill: result.vendorBill,
        message: `Vendor "${selectedQuotation.vendor.companyName}" awarded successfully. Bill created for finance.`,
      });
    }

    if (action === "close") {
      if (qr.status !== "open") return error("Only open requests can be closed", 409);

      const updated = await prisma.quotationRequest.update({
        where: { id },
        data: { status: "closed" },
      });

      return success({
        quotationRequest: updated,
        message: "Quotation request closed",
      });
    }

    return error('Action must be "award" or "close"');
  } catch (err) {
    console.error("[quotation-requests:update]", err);
    return error("Internal server error", 500);
  }
}
