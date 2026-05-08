// ─────────────────────────────────────────────
// GET  /api/quotation-requests — List quotation requests (role-filtered)
// POST /api/quotation-requests — Create quotation request (Dean/Admin)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES, VENDOR_CATEGORIES } from "@/lib/constants";
import { createAuditLog, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const eventId = searchParams.get("eventId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (eventId) where.eventId = eventId;

    // Role-based filtering
    if (decoded.role === ROLES.VENDOR) {
      // Vendors see only open requests matching their categories
      const vendor = await prisma.vendor.findUnique({
        where: { userId: decoded.userId },
      });
      if (!vendor || !vendor.isVerified) {
        return forbidden("Your vendor account is not verified");
      }
      where.status = "open";
      where.category = { in: vendor.categories };
      // Only show requests with future deadlines
      where.deadline = { gt: new Date() };
    } else if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(decoded.role)) {
      return forbidden("You do not have access to quotation requests");
    }

    const [requests, total] = await Promise.all([
      prisma.quotationRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          event: { select: { id: true, title: true } },
          resourceRequest: { select: { id: true, title: true, category: true } },
          requestedBy: { select: { id: true, name: true } },
          awardedTo: { select: { id: true, companyName: true } },
          _count: { select: { quotations: true } },
        },
      }),
      prisma.quotationRequest.count({ where }),
    ]);

    return success({
      quotationRequests: requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[quotation-requests:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(decoded.role)) {
      return forbidden("Only Dean or Admin can create quotation requests");
    }

    const body = await request.json();
    const missing = validateRequired(body, ["resourceRequestId", "title", "category"]);
    if (missing) return error(missing);

    // Validate category
    if (!VENDOR_CATEGORIES.includes(body.category)) {
      return error(`Invalid category. Must be one of: ${VENDOR_CATEGORIES.join(", ")}`);
    }

    // Validate deadline (must be at least 24h in future)
    if (body.deadline) {
      const deadline = new Date(body.deadline);
      const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (deadline < minDeadline) {
        return error("Deadline must be at least 24 hours from now");
      }
    }

    // Validate vendor IDs if specified (max 10)
    const vendorIds = body.vendorIds || [];
    if (vendorIds.length > 10) {
      return error("Maximum 10 vendors can be selected per request");
    }

    // Verify resource request exists
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: body.resourceRequestId },
      include: { event: { select: { id: true, title: true } } },
    });
    if (!resourceRequest) {
      return error("Resource request not found", 404);
    }

    // Determine target vendors
    let targetVendors;
    if (vendorIds.length > 0) {
      targetVendors = await prisma.vendor.findMany({
        where: { id: { in: vendorIds }, isVerified: true },
        select: { id: true, userId: true, companyName: true, categories: true },
      });
      // Validate all specified vendors exist and are verified
      if (targetVendors.length !== vendorIds.length) {
        return error("Some specified vendors are not found or not verified");
      }
    } else {
      // All verified vendors in matching category
      targetVendors = await prisma.vendor.findMany({
        where: { isVerified: true, categories: { has: body.category } },
        select: { id: true, userId: true, companyName: true },
      });

      // Warn if too many vendors (require confirmation)
      if (targetVendors.length > 20 && !body.confirmed) {
        return success({
          warning: true,
          vendorCount: targetVendors.length,
          message: `This will notify ${targetVendors.length} vendors. Send with "confirmed: true" to proceed.`,
        });
      }
    }

    if (targetVendors.length === 0) {
      return error("No verified vendors found for this category. Register vendors first.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create quotation request
      const qr = await tx.quotationRequest.create({
        data: {
          resourceRequestId: body.resourceRequestId,
          eventId: resourceRequest.eventId,
          title: body.title,
          description: body.description || null,
          requirements: body.requirements || null,
          category: body.category,
          budgetLimit: body.budgetLimit ? parseFloat(body.budgetLimit) : null,
          deadline: body.deadline ? new Date(body.deadline) : null,
          requestedById: decoded.userId,
        },
      });

      // Update resource request status
      await tx.resourceRequest.update({
        where: { id: body.resourceRequestId },
        data: { status: "quotation_requested" },
      });

      // Notify target vendors
      await tx.notification.createMany({
        data: targetVendors.map((v) => ({
          userId: v.userId,
          type: "quotation_request",
          title: "New Quotation Request",
          message: `You have a new quotation request: "${body.title}" for ${resourceRequest.event.title}`,
        })),
      });

      // Audit log
      await createAuditLog(tx, {
        action: AUDIT_ACTIONS.QUOTATION_REQUEST_CREATED,
        entityType: AUDIT_ENTITY_TYPES.QUOTATION_REQUEST,
        entityId: qr.id,
        userId: decoded.userId,
        metadata: {
          category: body.category,
          vendorCount: targetVendors.length,
          deadline: body.deadline || null,
          resourceRequestId: body.resourceRequestId,
        },
      });

      return qr;
    });

    return success({
      quotationRequest: result,
      vendorsNotified: targetVendors.length,
      message: `Quotation request created and ${targetVendors.length} vendor(s) notified`,
    }, 201);
  } catch (err) {
    console.error("[quotation-requests:create]", err);
    return error("Internal server error", 500);
  }
}
