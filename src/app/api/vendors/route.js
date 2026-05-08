// ─────────────────────────────────────────────
// GET /api/vendors — List vendors (Dean/Admin/Finance)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only Dean, Admin, Finance, Super Admin can view vendor list
    const allowedRoles = [ROLES.DEAN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.FINANCE];
    if (!allowedRoles.includes(decoded.role)) {
      return forbidden("Only administrators can view the vendor registry");
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const verified = searchParams.get("verified"); // "true" | "false" | null (all)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where filter
    const where = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categories = { has: category };
    }

    if (verified === "true") {
      where.isVerified = true;
    } else if (verified === "false") {
      where.isVerified = false;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          phone: true,
          email: true,
          categories: true,
          isVerified: true,
          verifiedAt: true,
          rating: true,
          totalOrders: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, isActive: true } },
          verifiedBy: { select: { id: true, name: true } },
          _count: {
            select: {
              quotations: true,
              documents: true,
              awardedQuotationRequests: true,
            },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return success({
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[vendors:list] Error:", err.message);
    console.error("[vendors:list] Stack:", err.stack);
    return error("Failed to load vendor registry. Please try again.", 500);
  }
}
