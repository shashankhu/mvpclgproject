// ─────────────────────────────────────────────
// GET /api/users/students — List students for club head selection
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only admin, dean, or faculty coordinator can list students
    const allowed = [ROLES.ADMIN, ROLES.DEAN, ROLES.FACULTY_COORDINATOR];
    if (!allowed.includes(decoded.role)) {
      return forbidden("Only admin, dean, or faculty coordinator can list students");
    }

    const students = await prisma.user.findMany({
      where: {
        role: { in: [ROLES.STUDENT, ROLES.CLUB_HEAD] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    return success({ students });
  } catch (err) {
    console.error("[users:students]", err);
    return error("Internal server error", 500);
  }
}
