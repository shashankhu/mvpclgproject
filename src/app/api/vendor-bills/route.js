// ─────────────────────────────────────────────
// GET /api/vendor-bills — List vendor bills (Finance/Dean/Admin/Vendor)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get("paymentStatus");
    const eventId = searchParams.get("eventId");
    const vendorId = searchParams.get("vendorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (eventId) where.eventId = eventId;
    if (vendorId) where.vendorId = vendorId;

    // Role-based filtering
    if (decoded.role === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({ where: { userId: decoded.userId } });
      if (!vendor) return forbidden("Vendor profile not found");
      where.vendorId = vendor.id;
    } else if (![ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE].includes(decoded.role)) {
      return forbidden("You do not have access to vendor bills");
    }

    const [bills, total] = await Promise.all([
      prisma.vendorBill.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          vendor: {
            select: { id: true, companyName: true, contactPerson: true, phone: true, email: true, gstNumber: true, panNumber: true },
          },
          event: { select: { id: true, title: true, eventDate: true } },
          quotation: {
            select: { id: true, amount: true, deliveryTimeline: true, version: true },
          },
          quotationRequest: {
            select: { id: true, title: true, category: true },
          },
          processedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.vendorBill.count({ where }),
    ]);

    // Calculate summary stats for finance dashboard
    let stats = null;
    if ([ROLES.FINANCE, ROLES.ADMIN, ROLES.DEAN, ROLES.SUPER_ADMIN].includes(decoded.role)) {
      const allBills = await prisma.vendorBill.groupBy({
        by: ["paymentStatus"],
        _sum: { totalAmount: true },
        _count: { id: true },
      });
      stats = {
        pending: { count: 0, total: 0 },
        processing: { count: 0, total: 0 },
        paid: { count: 0, total: 0 },
        rejected: { count: 0, total: 0 },
      };
      allBills.forEach((g) => {
        stats[g.paymentStatus] = {
          count: g._count.id,
          total: Number(g._sum.totalAmount || 0),
        };
      });
    }

    return success({
      bills,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[vendor-bills:list]", err);
    return error("Internal server error", 500);
  }
}
