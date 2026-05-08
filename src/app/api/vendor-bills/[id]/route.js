// ─────────────────────────────────────────────
// GET   /api/vendor-bills/[id] — Bill detail
// PATCH /api/vendor-bills/[id] — Update payment status (Finance only)
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

    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: {
        vendor: {
          select: { id: true, companyName: true, contactPerson: true, phone: true, email: true, gstNumber: true, panNumber: true, address: true },
        },
        event: { select: { id: true, title: true, eventDate: true } },
        quotationRequest: {
          include: { resourceRequest: { select: { title: true, description: true } } },
        },
        quotation: {
          include: { attachments: true },
        },
        attachments: true, // payment receipts
        processedBy: { select: { id: true, name: true } },
      },
    });

    if (!bill) return notFound("Vendor bill not found");

    // Access control
    if (decoded.role === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({ where: { userId: decoded.userId } });
      if (!vendor || vendor.id !== bill.vendorId) {
        return forbidden("You do not have access to this bill");
      }
    } else if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(decoded.role)) {
      return forbidden("You do not have access to vendor bills");
    }

    return success({ vendorBill: bill });
  } catch (err) {
    console.error("[vendor-bills:detail]", err);
    return error("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only Finance can manage payment status
    if (decoded.role !== ROLES.FINANCE && decoded.role !== ROLES.SUPER_ADMIN) {
      return forbidden("Only Finance department can update payment status");
    }

    const { id } = await params;
    const body = await request.json();
    const { paymentStatus, paymentReference, paymentComment, taxAmount, billNumber, attachmentIds } = body;

    const bill = await prisma.vendorBill.findUnique({
      where: { id },
      include: { vendor: { select: { userId: true, companyName: true } }, event: { select: { title: true } } },
    });

    if (!bill) return notFound("Vendor bill not found");

    const validStatuses = ["pending", "processing", "paid", "rejected"];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return error("Invalid payment status");
    }

    const updateData = {
      paymentStatus: paymentStatus || bill.paymentStatus,
      paymentReference: paymentReference !== undefined ? paymentReference : bill.paymentReference,
      paymentComment: paymentComment !== undefined ? paymentComment : bill.paymentComment,
      billNumber: billNumber !== undefined ? billNumber : bill.billNumber,
    };

    if (taxAmount !== undefined) {
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = Number(bill.billAmount) + Number(taxAmount);
    }

    // If status changed
    if (paymentStatus && paymentStatus !== bill.paymentStatus) {
      updateData.processedById = decoded.userId;
      updateData.processedAt = new Date();
      if (paymentStatus === "paid") {
        updateData.paymentDate = updateData.paymentDate || new Date();
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBill = await tx.vendorBill.update({
        where: { id },
        data: updateData,
      });

      // Link new attachments (receipts)
      if (attachmentIds && attachmentIds.length > 0) {
         await tx.attachment.updateMany({
           where: { id: { in: attachmentIds }, uploadedById: decoded.userId },
           data: { vendorBillId: id },
         });
      }

      // If status changed, notify vendor & log Audit
      if (paymentStatus && paymentStatus !== bill.paymentStatus) {
        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.PAYMENT_STATUS_CHANGED,
          entityType: AUDIT_ENTITY_TYPES.VENDOR_BILL,
          entityId: id,
          userId: decoded.userId,
          metadata: { oldStatus: bill.paymentStatus, newStatus: paymentStatus, processedBy: decoded.role },
        });

        if (paymentStatus === "paid") {
           await tx.notification.create({
             data: {
               userId: bill.vendor.userId,
               type: "payment_processed",
               title: "Payment Processed",
               message: `Your payment of ₹${Number(updatedBill.totalAmount).toLocaleString("en-IN")} for "${bill.event.title}" has been completed.`,
             },
           });
        }
      }

      return updatedBill;
    });

    return success({ vendorBill: result, message: "Vendor bill updated successfully" });
  } catch (err) {
    console.error("[vendor-bills:update]", err);
    return error("Internal server error", 500);
  }
}
