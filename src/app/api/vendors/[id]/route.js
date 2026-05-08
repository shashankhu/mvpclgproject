// ─────────────────────────────────────────────
// GET   /api/vendors/[id] — Vendor detail
// PATCH /api/vendors/[id] — Verify/reject vendor
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

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
        verifiedBy: { select: { id: true, name: true } },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        quotations: {
          where: { isLatest: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            quotationRequest: {
              select: { id: true, title: true, status: true, event: { select: { id: true, title: true } } },
            },
          },
        },
        vendorBills: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            event: { select: { id: true, title: true } },
          },
        },
        _count: {
          select: {
            quotations: true,
            awardedQuotationRequests: true,
            vendorBills: true,
          },
        },
      },
    });

    if (!vendor) return notFound("Vendor not found");

    // Access control: vendor can see own profile, admin/dean/finance can see any
    const allowedRoles = [ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE];
    const isOwnProfile = vendor.userId === decoded.userId;
    if (!isOwnProfile && !allowedRoles.includes(decoded.role)) {
      return forbidden("You do not have access to view this vendor");
    }

    return success({ vendor });
  } catch (err) {
    console.error("[vendors:detail]", err);
    return error("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only Dean, Admin can verify/reject vendors
    if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(decoded.role)) {
      return forbidden("Only Dean or Admin can manage vendor verification");
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: "verify" | "reject"

    if (!action || !["verify", "reject"].includes(action)) {
      return error('Action must be "verify" or "reject"');
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!vendor) return notFound("Vendor not found");

    if (action === "verify") {
      if (vendor.isVerified) {
        return error("Vendor is already verified", 409);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Mark vendor as verified
        const updated = await tx.vendor.update({
          where: { id },
          data: {
            isVerified: true,
            verifiedById: decoded.userId,
            verifiedAt: new Date(),
          },
        });

        // Activate user account
        await tx.user.update({
          where: { id: vendor.userId },
          data: { isActive: true },
        });

        // Notify vendor
        await tx.notification.create({
          data: {
            userId: vendor.userId,
            type: "vendor_verified",
            title: "Account Verified!",
            message: "Your vendor account has been verified. You can now login and respond to quotation requests.",
          },
        });

        // Audit log
        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.VENDOR_VERIFIED,
          entityType: AUDIT_ENTITY_TYPES.VENDOR,
          entityId: id,
          userId: decoded.userId,
          metadata: { companyName: vendor.companyName },
        });

        return updated;
      });

      return success({
        vendor: result,
        message: `Vendor "${vendor.companyName}" has been verified successfully`,
      });
    }

    if (action === "reject") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.vendor.update({
          where: { id },
          data: {
            isVerified: false,
            verifiedById: decoded.userId,
            verifiedAt: new Date(),
          },
        });

        // Keep user inactive
        await tx.user.update({
          where: { id: vendor.userId },
          data: { isActive: false },
        });

        // Notify vendor
        await tx.notification.create({
          data: {
            userId: vendor.userId,
            type: "vendor_rejected",
            title: "Registration Rejected",
            message: `Your vendor registration has been rejected.${reason ? ` Reason: ${reason}` : ""} Please contact administration for more details.`,
          },
        });

        // Audit log
        await createAuditLog(tx, {
          action: AUDIT_ACTIONS.VENDOR_REJECTED,
          entityType: AUDIT_ENTITY_TYPES.VENDOR,
          entityId: id,
          userId: decoded.userId,
          metadata: { companyName: vendor.companyName, reason: reason || null },
        });

        return updated;
      });

      return success({
        vendor: result,
        message: `Vendor "${vendor.companyName}" has been rejected`,
      });
    }
  } catch (err) {
    console.error("[vendors:update]", err);
    return error("Internal server error", 500);
  }
}
