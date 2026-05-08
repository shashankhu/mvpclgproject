// ─────────────────────────────────────────────
// GET /api/clubs/my — Get clubs user is a member of
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { role, userId } = decoded;

    // For Dean/Admin, return all active clubs
    if (role === ROLES.DEAN || role === ROLES.ADMIN) {
      const clubs = await prisma.club.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          department: true,
        },
      });
      return success({ clubs });
    }

    // For students/club heads, return only clubs they are members of
    if (role === ROLES.STUDENT || role === ROLES.CLUB_HEAD) {
      const memberships = await prisma.clubMember.findMany({
        where: { userId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              type: true,
              department: true,
              isActive: true,
            },
          },
        },
      });

      // Filter only active clubs and return with membership role
      const clubs = memberships
        .filter((m) => m.club.isActive)
        .map((m) => ({
          id: m.club.id,
          name: m.club.name,
          type: m.club.type,
          department: m.club.department,
          membershipRole: m.role, // "head" or "member"
        }));

      return success({ clubs });
    }

    // Other roles cannot create events, return empty
    return success({ clubs: [] });
  } catch (err) {
    console.error("[clubs:my]", err);
    return error("Internal server error", 500);
  }
}
