// ─────────────────────────────────────────────
// GET /api/users/faculty-coordinators — List faculty coordinators for club assignment
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only admin, dean, or faculty coordinator can list faculty coordinators
    const allowed = [ROLES.ADMIN, ROLES.DEAN, ROLES.FACULTY_COORDINATOR];
    if (!allowed.includes(decoded.role)) {
      return forbidden("Only admin, dean, or faculty coordinator can list faculty coordinators");
    }

    const facultyCoordinators = await prisma.user.findMany({
      where: {
        role: ROLES.FACULTY_COORDINATOR,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    return success({ facultyCoordinators });
  } catch (err) {
    console.error("[users:faculty-coordinators]", err);
    return error("Internal server error", 500);
  }
}
